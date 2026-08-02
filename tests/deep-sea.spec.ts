import { test, expect } from "./fixtures";
import type { Page } from "@playwright/test";

/**
 * The dive: scrolling past the hero sinks the page underwater.
 *
 * scene/depth.ts publishes --depth (0 at the waterline, 1 at the seafloor),
 * --water (0 or 1, never between), and the data-submerged attribute that
 * swaps the page onto its dark palette.
 */

/** Everything the dive publishes on <html>, read in one go. */
async function diveState(page: Page) {
  return page.evaluate(() => {
    const style = getComputedStyle(document.documentElement);
    return {
      depth: Number(style.getPropertyValue("--depth").trim() || "0"),
      water: Number(style.getPropertyValue("--water").trim() || "0"),
      submerged: document.documentElement.hasAttribute("data-submerged"),
    };
  });
}

test.describe("the dive", () => {
  test("goes from the surface to the seafloor as you scroll", async ({ homePage, page }) => {
    await homePage.goto();
    await homePage.settleHeight();

    expect((await diveState(page)).depth).toBe(0);

    await homePage.scrollTo(await homePage.maxScroll());
    expect((await diveState(page)).depth).toBeGreaterThan(0.99);
  });

  test("only ever descends on the way down", async ({ homePage, page }) => {
    await homePage.goto();
    await homePage.settleHeight();
    const max = await homePage.maxScroll();

    let previous = -1;
    for (let i = 0; i <= 10; i++) {
      await homePage.scrollTo(Math.round((max * i) / 10));
      const { depth } = await diveState(page);
      expect(depth, `depth must not go backwards at ${i * 10}%`).toBeGreaterThanOrEqual(previous);
      previous = depth;
    }
  });

  test("you are dry at the top and under once past the hero", async ({ homePage, page }) => {
    await homePage.goto();
    await homePage.settleHeight();
    await homePage.scrollTo(0);
    expect((await diveState(page)).submerged).toBe(false);

    await homePage.scrollTo(await homePage.maxScroll());
    expect((await diveState(page)).submerged).toBe(true);
  });

  test("the water and the text palette are never out of step", async ({ homePage, page }) => {
    /*
     * THE REGRESSION GUARD, and the reason the water steps instead of fading.
     *
     * The first version faded the water in gradually while the text stayed
     * dark-on-light until later. Every frame in between put dark text on a
     * half-dark background - measured at roughly 3:1, under the 4.5:1 this
     * site holds everywhere else. There is no crossfade that avoids it: a
     * mid-tone background has poor contrast with dark AND light text.
     *
     * So the invariant is that the water is only ever fully absent or fully
     * present, and always agrees with the palette. If someone reintroduces a
     * ramp, --water lands between 0 and 1 here and this fails.
     */
    await homePage.goto();
    await homePage.settleHeight();
    const max = await homePage.maxScroll();

    for (let i = 0; i <= 12; i++) {
      await homePage.scrollTo(Math.round((max * i) / 12));
      const { water, submerged } = await diveState(page);
      expect([0, 1], `--water must be 0 or 1, never mid-fade (at ${Math.round((i / 12) * 100)}%)`)
        .toContain(water);
      expect(water === 1, `water and palette must agree (at ${Math.round((i / 12) * 100)}%)`) //
        .toBe(submerged);
    }
  });

  test("the water sits behind the content, never over it", async ({ homePage, page }) => {
    // z-index -1 and pointer-events: none. If either regresses, the layer
    // starts swallowing clicks and covering the text.
    await homePage.goto();
    const layer = page.locator(".deep-sea");
    await expect(layer).toHaveCSS("z-index", "-1");
    await expect(layer).toHaveCSS("pointer-events", "none");
  });

  test("the nav still works from the bottom of the ocean", async ({ homePage }) => {
    // The dive writes to <html> on every frame; the scroll spy reads the same
    // scroll. This checks the two haven't started fighting.
    await homePage.goto();
    await homePage.settleHeight();
    await homePage.scrollTo(await homePage.maxScroll());
    await expect(homePage.nav.activeLink).toHaveText("Contact");
  });
});
