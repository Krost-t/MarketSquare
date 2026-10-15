import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import { api, auth, prisma, registerUser, resetDatabase } from "./helpers.ts";

describe("Marketplace flow", () => {
    let merchantToken: string;
    let customerToken: string;
    let shopId: string;
    let productId: string;

    beforeAll(async () => {
        await resetDatabase();
        merchantToken = (await registerUser("MERCHANT")).token;
        customerToken = (await registerUser("USER")).token;
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    it("forbids a customer from creating a shop", async () => {
        const res = await api().post("/shops").set(auth(customerToken)).send({ name: "Nope" });
        expect(res.status).toBe(403);
    });

    it("lets a merchant create a single shop with its address", async () => {
        const res = await api().post("/shops").set(auth(merchantToken)).send({
            name: "Boulangerie du Coin",
            description: "Pain au levain",
            address: {
                streetAddress: "12 rue des Lilas",
                postalCode: "75011",
                addressLocality: "Paris",
                addressRegion: "Île-de-France",
                addressCountry: "fr",
            },
        });

        expect(res.status).toBe(201);
        expect(res.body.data.address.addressCountry).toBe("FR");
        shopId = res.body.data.id;

        const again = await api().post("/shops").set(auth(merchantToken)).send({ name: "Second shop" });
        expect(again.status).toBe(409);
    });

    it("finds shops by postal code", async () => {
        const res = await api().get("/shops").query({ postalCode: "750" });
        expect(res.body.data).toHaveLength(1);

        const none = await api().get("/shops").query({ postalCode: "130" });
        expect(none.body.data).toHaveLength(0);
    });

    it("lets the merchant add products", async () => {
        const res = await api().post("/products").set(auth(merchantToken)).send({
            name: "Baguette tradition",
            price: 1.3,
            stock: 5,
        });

        expect(res.status).toBe(201);
        expect(res.body.data.price).toBe("1.3");
        productId = res.body.data.id;

        const list = await api().get("/products").query({ search: "baguette" });
        expect(list.body.pagination.total).toBe(1);
    });

    it("prevents another merchant from editing the product", async () => {
        const other = await registerUser("MERCHANT");
        const res = await api().patch(`/products/${productId}`).set(auth(other.token)).send({ price: 0.5 });
        expect(res.status).toBe(403);
    });

    it("refuses to add more items than the stock", async () => {
        const res = await api().post("/cart/items").set(auth(customerToken)).send({ productId, quantity: 6 });
        expect(res.status).toBe(400);
    });

    it("builds the cart with a server-side total", async () => {
        const res = await api().post("/cart/items").set(auth(customerToken)).send({ productId, quantity: 3 });

        expect(res.status).toBe(201);
        expect(res.body.data.total).toBe("3.90");
        expect(res.body.data.itemCount).toBe(3);
    });

    let orderId: string;

    it("checks out in click & collect, decrements stock and empties the cart", async () => {
        const res = await api().post("/orders/checkout").set(auth(customerToken))
            .send({ deliveryMethod: "PICKUP", paymentMethod: "ON_SITE" });

        expect(res.status).toBe(201);
        expect(res.body.data).toHaveLength(1);
        expect(res.body.data[0].totalAmount).toBe("3.9");
        expect(res.body.data[0].items[0].productName).toBe("Baguette tradition");
        orderId = res.body.data[0].id;

        const product = await api().get(`/products/${productId}`);
        expect(product.body.data.stock).toBe(2);

        const cart = await api().get("/cart").set(auth(customerToken));
        expect(cart.body.data.items).toHaveLength(0);
    });

    it("requires an address for delivery", async () => {
        await api().post("/cart/items").set(auth(customerToken)).send({ productId, quantity: 1 });
        const res = await api().post("/orders/checkout").set(auth(customerToken))
            .send({ deliveryMethod: "DELIVERY", paymentMethod: "CARD" });
        expect(res.status).toBe(400);
        await api().delete("/cart").set(auth(customerToken));
    });

    it("lets the merchant follow the order lifecycle", async () => {
        const list = await api().get("/orders/shop/mine").set(auth(merchantToken));
        expect(list.body.data).toHaveLength(1);

        const invalid = await api().patch(`/orders/${orderId}/status`).set(auth(merchantToken)).send({ status: "RETURNED" });
        expect(invalid.status).toBe(400);

        const preparing = await api().patch(`/orders/${orderId}/status`).set(auth(merchantToken)).send({ status: "PREPARING" });
        expect(preparing.body.data.status).toBe("PREPARING");

        const cancel = await api().patch(`/orders/${orderId}/cancel`).set(auth(customerToken));
        expect(cancel.status).toBe(400);

        const delivered = await api().patch(`/orders/${orderId}/status`).set(auth(merchantToken)).send({ status: "DELIVERED" });
        expect(delivered.body.data.status).toBe("DELIVERED");

        const mine = await api().get("/orders").set(auth(customerToken));
        expect(mine.body.data[0].status).toBe("DELIVERED");
    });

    it("restocks when the customer cancels a pending order", async () => {
        await api().post("/cart/items").set(auth(customerToken)).send({ productId, quantity: 2 });
        const checkout = await api().post("/orders/checkout").set(auth(customerToken))
            .send({ deliveryMethod: "PICKUP", paymentMethod: "CARD" });
        expect((await api().get(`/products/${productId}`)).body.data.stock).toBe(0);

        const cancel = await api().patch(`/orders/${checkout.body.data[0].id}/cancel`).set(auth(customerToken));
        expect(cancel.body.data.status).toBe("CANCELLED");
        expect((await api().get(`/products/${productId}`)).body.data.stock).toBe(2);
    });

    it("updates the average rating with reviews", async () => {
        const res = await api().post("/reviews").set(auth(customerToken)).send({ productId, rating: 4, comment: "Très bonne" });
        expect(res.status).toBe(201);

        const second = await registerUser();
        await api().post("/reviews").set(auth(second.token)).send({ productId, rating: 5 });

        const product = await api().get(`/products/${productId}`);
        expect(product.body.data.averageRating).toBe("4.5");
        expect(product.body.data.reviewCount).toBe(2);

        const own = await api().post("/reviews").set(auth(merchantToken)).send({ shopId, rating: 5 });
        expect(own.status).toBe(403);

        const duplicate = await api().post("/reviews").set(auth(customerToken)).send({ productId, rating: 1 });
        expect(duplicate.status).toBe(409);
    });

    it("manages favorites", async () => {
        await api().post(`/user/favorites/${productId}`).set(auth(customerToken)).expect(201);

        const product = await api().get(`/products/${productId}`).set(auth(customerToken));
        expect(product.body.data.isFavorite).toBe(true);

        const favorites = await api().get("/user/favorites").set(auth(customerToken));
        expect(favorites.body.data).toHaveLength(1);

        await api().delete(`/user/favorites/${productId}`).set(auth(customerToken)).expect(200);
    });

    it("keeps order history when a product is deleted", async () => {
        await api().delete(`/products/${productId}`).set(auth(merchantToken)).expect(200);

        const orders = await api().get("/orders").set(auth(customerToken));
        expect(orders.body.data[0].items[0].productName).toBe("Baguette tradition");
    });
});
