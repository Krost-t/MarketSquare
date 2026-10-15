describe("Parcours marchand", () => {
    const productName = `Brioche ${Date.now()}`;

    beforeEach(() => {
        cy.login("boulangerie@marketsquare.dev");
    });

    it("ajoute un produit puis le retire du catalogue", () => {
        cy.visit("/merchant/products");
        cy.contains("button", "Nouveau produit").click();
        cy.contains("label", "Nom").find("input").type(productName);
        cy.contains("label", "Prix").find("input").type("6.5");
        cy.contains("label", "Stock").find("input").clear().type("8");
        cy.contains("button", "Enregistrer").click();

        cy.contains("tr", productName).should("contain", "6,50");

        cy.visit(`/products?search=${encodeURIComponent(productName)}`);
        cy.contains(productName).should("be.visible");

        cy.visit("/merchant/products");
        cy.contains("tr", productName).find(`button[aria-label="Supprimer ${productName}"]`).click();
        cy.contains("tr", productName).should("not.exist");
    });

    it("fait avancer une commande reçue", () => {
        const api = "http://localhost:4896";
        cy.request("POST", `${api}/auth/login`, { email: "client@marketsquare.dev", password: "Password123!" }).then(({ body }) => {
            const headers = { Authorization: `Bearer ${body.token}` };
            cy.request({ url: `${api}/products?search=Baguette`, headers }).then(({ body: products }) => {
                cy.request({ method: "POST", url: `${api}/cart/items`, headers, body: { productId: products.data[0].id, quantity: 1 } });
                cy.request({ method: "POST", url: `${api}/orders/checkout`, headers, body: { deliveryMethod: "PICKUP", paymentMethod: "ON_SITE" } });
            });
        });
        cy.clearCookies();

        cy.login("boulangerie@marketsquare.dev");
        cy.visit("/merchant/orders");
        cy.contains("button", "En attente").click();
        cy.get("li.card").first().within(() => {
            cy.contains("Baguette tradition").should("be.visible");
            cy.contains("button", "En préparation").click();
        });
        cy.contains("button", "En préparation").click();
        cy.get("li.card").first().contains("Livrée / retirée").should("be.visible");
    });
});
