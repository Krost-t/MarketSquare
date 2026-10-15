describe("Parcours client", () => {
    it("trouve une boutique par code postal", () => {
        cy.visit("/shops");
        cy.get('input[aria-label="Code postal"]').type("75011");
        cy.contains("button", "Rechercher").click();
        cy.location("search").should("contain", "postalCode=75011");
        cy.contains("Boulangerie Lucette").should("be.visible");

        cy.get('input[aria-label="Code postal"]').clear().type("69001");
        cy.contains("button", "Rechercher").click();
        cy.contains("Boulangerie Lucette").should("not.exist");
    });

    it("commande en click & collect et suit sa commande", () => {
        cy.login("client@marketsquare.dev");
        cy.visit("/products?search=baguette");
        cy.contains("a", "Baguette tradition").click();
        cy.contains("button", "Ajouter au panier").click();
        cy.contains("Ajouté au panier").should("be.visible");

        cy.contains("a", "Voir le panier").click();
        cy.contains("Baguette tradition").should("be.visible");
        cy.contains("label", "Click & collect").find("input").should("be.checked");
        cy.contains("button", "Commander").click();

        cy.location("pathname").should("eq", "/orders");
        cy.contains("commande(s) envoyée(s)").should("be.visible");
        cy.contains("Boulangerie Lucette").click();
        cy.contains("Baguette tradition").should("be.visible");
        cy.contains("button", "Annuler la commande").click();
        cy.contains("Annulée").should("be.visible");
    });

    it("protège les pages privées", () => {
        cy.visit("/cart");
        cy.location("pathname").should("eq", "/login");
    });
});
