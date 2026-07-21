import { test as base } from "@playwright/test";
import { HomePage } from "./pages/HomePage";
import { NotFoundPage } from "./pages/NotFoundPage";

/**
 * Playwright fixtures - the wiring of the Page Object Model framework.
 *
 * `test.extend` teaches Playwright to build our page objects on demand: any
 * test that lists `homePage` (or `notFoundPage`) in its arguments receives a
 * ready-made instance wrapping that test's isolated browser page:
 *
 *   import { test, expect } from "./fixtures";
 *
 *   test("shows my name", async ({ homePage }) => {
 *     await homePage.goto();
 *     await expect(homePage.heroName).toHaveText("Flying Felix");
 *   });
 *
 * Specs import `test` and `expect` from THIS file instead of
 * "@playwright/test" - that's the only change needed to opt in.
 */
type Fixtures = {
  homePage: HomePage;
  notFoundPage: NotFoundPage;
};

export const test = base.extend<Fixtures>({
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },
  notFoundPage: async ({ page }, use) => {
    await use(new NotFoundPage(page));
  },
});

export { expect } from "@playwright/test";
