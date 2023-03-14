context("Basic", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  it("basic nav", () => {
    cy.url().should("eq", "http://localhost:3000/");
    cy.contains("h1", "Welcome").should("exist");
  });

  it("counter", () => {
    cy.contains('[data-cy="counter-btn"]', "Counter 0").should("exist");
  });

  it("about", () => {
    cy.contains("a", "About")
      .click()
      .url()
      .should("eq", "http://localhost:3000/about");

    cy.contains("h1", "About").should("exist");
  });

  it("data fetching", () => {
    cy.get('a[href="/star-wars"]')
      .click()
      .url()
      .should("eq", "http://localhost:3000/star-wars");

    cy.contains("h1", "Star Wars Movies").should("exist");

    cy.contains("body", "The Phantom Menace").should("exist");
  });

  it("404", () => {
    cy.visit("/404", { failOnStatusCode: false });

    cy.contains("h1", "404 Page Not Found").should("exist");
    cy.contains("p", "This page could not be found.").should("exist");
  });
});
