declare global {
    namespace Cypress {
        interface Chainable {
            login(email: string, password?: string): Chainable<void>;
        }
    }
}

Cypress.Commands.add("login", (email: string, password = "Password123!") => {
    cy.session(email, () => {
        cy.visit("/login");
        cy.get("input[type=email]").type(email);
        cy.get("input[type=password]").type(password);
        cy.contains("button", "Se connecter").click();
        cy.location("pathname").should("eq", "/");
    });
});

export {};
