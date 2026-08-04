import { test, expect } from "./fixtures";
import type { Page } from "@playwright/test";

/**
 * The dive: in DARK MODE, scrolling past the hero sinks the page underwater
 * and the light fails as you go down.
 *
 * scene/depth.ts publishes --depth (0 at the waterline, 1 at the seafloor)
 * and --water (how opaque the water is). In light mode neither moves - see
 * the "stays dry in light mode" test at the bottom, which is the one that
 * pins the deliberate decision rather than an accident.
 */

/** What the dive is publishing on <html> right now. */
async function diveState(page: Page) {
  return page.evaluate(() => {
    const style = getComputedStyle(document.documentElement);
    return {
      depth: Number(style.getPropertyValue("--depth").trim() || "0"),
      water: Number(style.getPropertyValue("--water").trim() || "0"),
    };
  });
}

test.describe("the dive (dark mode)", () => {
  test("goes from the surface to the seafloor as you scroll", async ({ homePage, page }) => {
    await homePage.goto("./", "dark");
    await homePage.settleHeight();

    expect((await diveState(page)).depth).toBe(0);

    await homePage.scrollTo(await homePage.maxScroll());
    expect((await diveState(page)).depth).toBeGreaterThan(0.99);
  });

  test("only ever descends on the way down", async ({ homePage, page }) => {
    await homePage.goto("./", "dark");
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

  test("the sea is already there by the time the waves leave the screen", async ({
    homePage,
    page,
  }) => {
    /*
     * Continuity at the waterline, which is the thing that looked worst when
     * it was wrong. The water sits behind the hero, so it can fill while the
     * hero still hides it; what must not happen is the waves scrolling away
     * to reveal page background, then water arriving afterwards. That showed
     * as the sea's colour jumping at the seam.
     *
     * So by a short way into the descent the water is fully present, and the
     * gradual part of the dive is the colour darkening from --wave-break
     * toward black rather than anything fading in.
     */
    await homePage.goto("./", "dark");
    await homePage.settleHeight();
    const max = await homePage.maxScroll();

    await homePage.scrollTo(Math.round(max * 0.2));
    const { water, depth } = await diveState(page);
    expect(water, "the sea must be fully present once you are under").toBe(1);
    expect(depth, "and still near the top of the descent, with the darkening to come")
      .toBeLessThan(0.35);
  });

  test("the water sits behind the content, never over it", async ({ homePage, page }) => {
    // z-index -1 and pointer-events: none. If either regresses the layer
    // starts swallowing clicks and covering the text.
    await homePage.goto("./", "dark");
    const layer = page.locator(".deep-sea");
    await expect(layer).toHaveCSS("z-index", "-1");
    await expect(layer).toHaveCSS("pointer-events", "none");
  });

  test("the nav still works from the bottom of the ocean", async ({ homePage }) => {
    // The dive writes to <html> every frame; the scroll spy reads the same
    // scroll. This checks the two haven't started fighting.
    await homePage.goto("./", "dark");
    await homePage.settleHeight();
    await homePage.scrollTo(await homePage.maxScroll());
    await expect(homePage.nav.activeLink).toHaveText("Contact");
  });
});

test.describe("the dive stays out of light mode", () => {
  test("nothing sinks, however far you scroll", async ({ homePage, page }) => {
    /*
     * Deliberate, not an oversight. Sinking a light page means flipping the
     * text from dark-on-light to light-on-dark partway down, which cannot be
     * done gradually - a mid-tone background has poor contrast with both - so
     * it had to snap, and a page changing polarity under you while you read
     * is jarring. The light theme is a bright overcast morning and stays one.
     */
    await homePage.goto("./", "light");
    await homePage.settleHeight();
    await homePage.scrollTo(await homePage.maxScroll());

    const { depth, water } = await diveState(page);
    expect(depth, "light mode must not descend").toBe(0);
    expect(water, "light mode must stay dry").toBe(0);
    await expect(page.locator(".deep-sea")).toHaveCSS("opacity", "0");
  });

  test("switching to dark mid-page fills the water without a scroll", async ({
    homePage,
    page,
  }) => {
    // The hook watches data-theme, so the toggle has to take effect straight
    // away rather than waiting for the next scroll event.
    await homePage.goto("./", "light");
    await homePage.settleHeight();
    await homePage.scrollTo(await homePage.maxScroll());
    expect((await diveState(page)).water).toBe(0);

    await homePage.nav.toggleTheme();
    await expect.poll(async () => (await diveState(page)).water).toBeGreaterThan(0.9);
  });
});
