import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import { api, auth, createAdmin, prisma, registerUser, resetDatabase } from "./helpers.ts";

describe("Admin", () => {
    let adminToken: string;
    let adminId: string;

    beforeAll(async () => {
        await resetDatabase();
        const admin = await createAdmin();
        adminToken = admin.token;
        adminId = admin.user.id;
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    it("is forbidden to regular users", async () => {
        const { token } = await registerUser();
        expect((await api().get("/admin/users-list").set(auth(token))).status).toBe(403);
    });

    it("returns platform stats", async () => {
        const res = await api().get("/admin/dashboard").set(auth(adminToken));
        expect(res.status).toBe(200);
        expect(res.body.data.users).toBeGreaterThanOrEqual(1);
    });

    it("creates, promotes and deletes a user", async () => {
        const created = await api().post("/admin/create-user").set(auth(adminToken)).send({
            lastname: "Martin", firstname: "Léa", gender: "FEMALE", dateOfBirth: "1992-06-01",
            phone: "0611223344", email: "lea@test.dev", password: "Password123!",
        });
        expect(created.status).toBe(201);
        expect(created.body.data).not.toHaveProperty("password");
        const id = created.body.data.id;

        const promoted = await api().patch(`/admin/update-user/${id}/role`).set(auth(adminToken)).send({ role: "MERCHANT" });
        expect(promoted.body.data.role).toBe("MERCHANT");

        const search = await api().get("/admin/users-list").query({ search: "lea@" }).set(auth(adminToken));
        expect(search.body.data).toHaveLength(1);

        await api().delete(`/admin/delete-user/${id}`).set(auth(adminToken)).expect(200);
        await api().get(`/admin/user/${id}`).set(auth(adminToken)).expect(404);
    });

    it("cannot demote itself", async () => {
        const res = await api().patch(`/admin/update-user/${adminId}/role`).set(auth(adminToken)).send({ role: "USER" });
        expect(res.status).toBe(400);
    });

    it("moderates shops and reviews", async () => {
        const merchant = await registerUser("MERCHANT");
        const customer = await registerUser();
        const shop = await api().post("/shops").set(auth(merchant.token)).send({ name: "Shop à modérer" });
        const review = await api().post("/reviews").set(auth(customer.token)).send({ shopId: shop.body.data.id, rating: 1, comment: "spam" });

        const negative = await api().get("/admin/reviews-list").query({ maxRating: 2 }).set(auth(adminToken));
        expect(negative.body.data).toHaveLength(1);

        await api().delete(`/admin/delete-review/${review.body.data.id}`).set(auth(adminToken)).expect(200);
        const shopAfter = await api().get(`/shops/${shop.body.data.id}`);
        expect(shopAfter.body.data.reviewCount).toBe(0);

        await api().delete(`/admin/delete-shop/${shop.body.data.id}`).set(auth(adminToken)).expect(200);
        await api().get(`/shops/${shop.body.data.id}`).expect(404);
    });

    it("rejects malformed ids", async () => {
        const res = await api().get("/admin/user/not-a-uuid").set(auth(adminToken));
        expect(res.status).toBe(400);
    });
});
