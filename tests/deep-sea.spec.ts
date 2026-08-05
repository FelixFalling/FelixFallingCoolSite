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

  test("gets darker the whole way down, never brighter", async ({ homePage, page }) => {
    /*
     * The dive has to get darker the whole way, and the interesting half of
     * that is the FIRST step - the water against the sky it continues from.
     *
     * The bug this guards was exactly there: the water started from
     * --wave-break, a lit highlight on the top of the swell and much brighter
     * than the night sky above it. Scrolling down brightened the page first
     * and only darkened afterwards - dark sky, bright band, black abyss. The
     * water's own progression was perfectly monotonic throughout, which is
     * why an earlier version of this test, comparing only the water against
     * itself, passed while the bug was present. It has to be compared against
     * the hero.
     *
     * Colours are normalised through a canvas because the two sides arrive in
     * different formats - a hex token for the sky, oklab() for the
     * color-mix()ed water - and 1x1 fills give directly comparable sRGB.
     */
    await homePage.goto("./", "dark");
    await homePage.settleHeight();
    const max = await homePage.maxScroll();

    /** Relative luminance of any CSS colour string, via a 1x1 canvas fill. */
    const luminanceOf = async (cssColor: string) =>
      page.evaluate((color) => {
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 1;
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, 1, 1);
        const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
        const channel = (c: number) => {
          const s = c / 255;
          return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
        };
        return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
      }, cssColor);

    const waterColour = async () =>
      page.evaluate(
        () => getComputedStyle(document.querySelector(".deep-sea")!).backgroundColor,
      );

    const token = async (name: string) =>
      page.evaluate(
        (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim(),
        name,
      );

    /*
     * Start at the HORIZON and walk down: sky glow → the three surface bands
     * → the water below.
     *
     * Not from the top of the sky, deliberately. A night sky is darkest
     * overhead and brightest where it meets the sea, so the hero legitimately
     * brightens downward; the horizon is the brightest point of the scene and
     * everything after it should fall away. Asserting from the top would fail
     * on a moonlit horizon, which is correct and wanted.
     *
     * What this DOES catch is the fault that made the page read as
     * dark-light-dark: the sea's own bands ran 0.041 → 0.090 → 0.150 toward
     * the viewer, brighter than the sky they reflect, leaving a lit stripe
     * across the middle of the page with darkness above and below. Water
     * cannot outshine what it reflects, so each band must be no brighter than
     * the horizon and each must be darker than the one behind it.
     */
    let previous = Infinity;
    let where = "";
    for (const stop of ["--hero-to", "--wave-far", "--wave-mid", "--wave-break"]) {
      const current = await luminanceOf(await token(stop));
      expect(current, `the sea brightened toward the viewer at ${stop} (after ${where})`) //
        .toBeLessThanOrEqual(previous + 0.001);
      previous = current;
      where = stop;
    }

    for (let i = 0; i <= 8; i++) {
      await homePage.scrollTo(Math.round((max * i) / 8));
      const current = await luminanceOf(await waterColour());
      const pct = `${Math.round((i / 8) * 100)}%`;
      expect(current, `the page brightened going down, at ${pct} (after ${where})`) //
        .toBeLessThanOrEqual(previous + 0.001);
      previous = current;
      where = `water ${pct}`;
    }
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
