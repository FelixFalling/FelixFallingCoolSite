import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "./fixtures";
import type { BasePage } from "./pages/BasePage";

/**
 * Automated accessibility checks with axe-core - the same engine behind
 * browser accessibility DevTools. Each test loads a page through its page
 * object, lets it settle, and asserts axe finds ZERO violations of the
 * WCAG A/AA rules.
 *
 * If one of these fails, the report in the failure message names the rule,
 * the elements, and a link explaining how to fix it. These tests keep the
 * site accessible as it grows - a color tweak that breaks contrast, or a
 * new button without a label, fails CI instead of shipping.
 */

/**
 * Run axe against a page object's page, limited to WCAG A/AA rules.
 *
 * Reduced motion is emulated before navigating so the scroll-reveal sections
 * appear instantly at full opacity - otherwise axe can catch text mid-fade
 * and report contrast for blended in-between colors that no settled page has.
 */
async function scan(pageObject: BasePage, goto: () => Promise<void>) {
  await pageObject.page.emulateMedia({ reducedMotion: "reduce" });
  await goto();
  return new AxeBuilder({ page: pageObject.page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
}

test.describe("accessibility (axe-core, WCAG A/AA)", () => {
  test("home page - light theme", async ({ homePage }) => {
    const results = await scan(homePage, () => homePage.goto("./", "light"));
    expect(results.violations).toEqual([]);
  });

  test("home page - dark theme", async ({ homePage }) => {
    const results = await scan(homePage, () => homePage.goto("./", "dark"));
    expect(results.violations).toEqual([]);
  });

  test("404 page", async ({ notFoundPage }) => {
    const results = await scan(notFoundPage, () => notFoundPage.goto());
    expect(results.violations).toEqual([]);
  });
});
