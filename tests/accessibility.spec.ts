import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Automated accessibility checks with axe-core — the same engine behind
 * browser accessibility DevTools. Each test loads a page, lets it settle,
 * and asserts axe finds ZERO violations of the WCAG A/AA rules.
 *
 * If one of these fails, the report in the failure message names the rule,
 * the elements, and a link explaining how to fix it. These tests keep the
 * site accessible as it grows — a color tweak that breaks contrast, or a
 * new button without a label, fails CI instead of shipping.
 */

/**
 * Load a page and run axe against it, limited to WCAG A/AA rules.
 *
 * Reduced motion is emulated first so the scroll-reveal sections appear
 * instantly at full opacity — otherwise axe can catch text mid-fade and
 * report contrast for blended in-between colors that no settled page has.
 */
async function scan(page: import("@playwright/test").Page, url: string) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(url);
  return new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
}

test.describe("accessibility (axe-core, WCAG A/AA)", () => {
  test("home page — light theme", async ({ page }) => {
    const results = await scan(page, "./?theme=light");
    expect(results.violations).toEqual([]);
  });

  test("home page — dark theme", async ({ page }) => {
    const results = await scan(page, "./?theme=dark");
    expect(results.violations).toEqual([]);
  });

  test("404 page", async ({ page }) => {
    const results = await scan(page, "./this-page-does-not-exist/");
    expect(results.violations).toEqual([]);
  });
});
