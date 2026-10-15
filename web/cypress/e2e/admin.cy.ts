describe("Parcours admin", () => {
    it("consulte les statistiques et modère", () => {
        cy.login("admin@marketsquare.dev");
        cy.visit("/admin");
        cy.get("main").contains("Commerçants").should("be.visible");
        cy.get("main").contains("Volume d’affaires").should("be.visible");

        cy.get("main").contains("a", "Utilisateurs").click();
        cy.get("input[aria-label='Rechercher un utilisateur']").type("client@");
        cy.contains("button", "Rechercher").click();
        cy.contains("client@marketsquare.dev").should("be.visible");

        cy.get("main").contains("a", "Avis").click();
        cy.contains("Uniquement les avis négatifs").should("be.visible");
    });

    it("refuse l'accès à un client", () => {
        cy.login("client@marketsquare.dev");
        cy.visit("/admin");
        cy.contains("Accès refusé").should("be.visible");
    });
});
