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

  test("home page - submerged at the bottom of the dive", async ({ homePage }) => {
    /*
     * The scans above only ever look at the top of the page, where the site is
     * on its ordinary palette. Scrolling swaps it onto the dark one and puts
     * near-black water behind everything (scene/depth.ts), so this is a
     * genuinely different set of colours that nothing else checks.
     *
     * Worth having because the first version of the dive DID break contrast -
     * fading the water in under dark text left the body copy near 3:1. axe
     * resolves the real composited background, so it catches that class of
     * mistake in a way a unit-style assertion on tokens cannot.
     */
    await homePage.page.emulateMedia({ reducedMotion: "reduce" });
    await homePage.goto();
    await homePage.settleHeight();

    // Put the section ON SCREEN and scan only it.
    //
    // Scanning the whole page from the seafloor does not work, and the reason
    // is worth recording: the water is a position:fixed layer covering the
    // viewport, and axe composites every element against it - including the
    // ones scrolled thousands of pixels above, which that layer is not
    // actually behind. It reported the About copy at 2.5:1 while sitting at
    // top:-2798, off screen. Hiding the layer dropped the violation count from
    // ten to one, which is what identified it as an artifact rather than a
    // real failure. Scanning a section while it is genuinely in view compares
    // the colours a person would actually see.
    const contact = homePage.page.locator("#contact");
    await contact.scrollIntoViewIfNeeded();
    await homePage.page.waitForTimeout(400);

    const results = await new AxeBuilder({ page: homePage.page })
      .include("#contact")
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  });
});
