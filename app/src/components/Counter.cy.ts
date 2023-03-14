import Counter from "./Counter.vue";

describe("<Counter />", () => {
  it("renders", () => {
    // see: https://on.cypress.io/mounting-vue
    cy.mount(Counter);
    const counter = cy.get('[data-cy="counter-btn"]');
    counter.should("exist");
    counter.should("have.text", "Counter 0");
    counter.click();
    counter.should("have.text", "Counter 1");
  });
});
