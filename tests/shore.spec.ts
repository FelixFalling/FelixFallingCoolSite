import { test, expect } from "./fixtures";
import type { Page } from "@playwright/test";

/**
 * The shoreline's geometry: the rocks have to stand IN the water, the same way,
 * at every screen width.
 *
 * Nothing tested this before, which is how it drifted. The rocks were placed
 * with `bottom: Npx + --shore-lift`, where the lift rose 1:1 with the sea
 * band - but the wave crests are drawn at fractions of that band's height
 * (the tiles stretch, preserveAspectRatio="none"), so the water surface climbed
 * about a quarter as fast. The rocks rose clear of the sea as the window
 * widened: roughly 37px of daylight under them at 1200px, 106px at 4K. They
 * looked like they were floating, and their proportions appeared to change
 * while the window was being dragged.
 */

/** Where the solid water starts, above the hero's bottom edge. Mirrors the
 *  --waterline formula in globals.css: the front wave layer is drawn at y=152
 *  of a 200-tall viewBox, in a tile anchored 28px below the band. */
const waterlineOf = (wavesHeight: number) => wavesHeight * 0.24 - 21;

/** The headland cluster's base and width, plus the sea band it sits in. */
async function shoreAt(page: Page, width: number) {
  await page.setViewportSize({ width, height: 900 });
  await page.waitForTimeout(350); // let the clamp()s settle
  return page.evaluate(() => {
    const hero = document.querySelector("header")!.getBoundingClientRect();
    const strip = document.querySelector(".waves-strip")!.getBoundingClientRect();
    const rock = document.querySelector('svg[viewBox="0 0 360 240"]')!.getBoundingClientRect();
    return {
      wavesHeight: strip.height,
      // How far the rock's foot sits above the hero's bottom edge.
      base: hero.bottom - rock.bottom,
      width: rock.width,
    };
  });
}

test.describe("the shoreline", () => {
  test("the rocks stand in the water at every width", async ({ homePage, page }) => {
    await homePage.goto("./", "dark");

    for (const width of [1200, 1440, 1600, 2100, 2560]) {
      const { wavesHeight, base } = await shoreAt(page, width);
      const submergedBy = waterlineOf(wavesHeight) - base;

      expect(submergedBy, `the rock floats above the water at ${width}px`).toBeGreaterThan(0);
      // A token amount would still read as floating - the front wave has to
      // visibly cross the rock's foot.
      expect(submergedBy, `barely submerged at ${width}px`).toBeGreaterThan(4);
    }
  });

  test("submersion doesn't drift as the window widens", async ({ homePage, page }) => {
    /*
     * The assertion that encodes the actual complaint. It is not enough for
     * the rocks to be underwater at each width independently - they have to be
     * underwater by a CONSISTENT amount, or the silhouette above the surface
     * changes shape while the window is dragged.
     *
     * Measured against the sea band rather than in raw pixels, since the band
     * itself grows with the viewport.
     */
    await homePage.goto("./", "dark");

    const depths: number[] = [];
    for (const width of [1200, 1440, 1600, 2100, 2560]) {
      const { wavesHeight, base } = await shoreAt(page, width);
      depths.push((waterlineOf(wavesHeight) - base) / wavesHeight);
    }

    const spread = Math.max(...depths) - Math.min(...depths);
    expect(spread, `submersion varied across widths: ${depths.map((d) => d.toFixed(3))}`) //
      .toBeLessThan(0.03);
  });

  test("the rocks grow smoothly, without snapping", async ({ homePage, page }) => {
    /*
     * --shore-scale used to step at 1200, 1600 and 2100, so the rocks jumped
     * size mid-drag with nothing else on the page changing. They size
     * themselves from --shore-size in em now, which is a clamp on vw.
     *
     * The sweep starts above 1200 deliberately: that breakpoint switches the
     * whole page to the desktop layout and deepens the sea, so a step there is
     * expected and wanted. The ones that looked broken were the silent ones
     * further up.
     */
    await homePage.goto("./", "dark");

    /*
     * Measured ACROSS each old breakpoint, one pixel either side. Sampling at
     * coarse intervals instead does not work: the size legitimately grows with
     * the viewport, so a 250px step showed ~9% growth and looked like a jump.
     * A snap is a discontinuity - a big change for a 1px move - and this is
     * the only way to tell the two apart.
     */
    for (const breakpoint of [1600, 2100]) {
      const before = (await shoreAt(page, breakpoint - 1)).width;
      const after = (await shoreAt(page, breakpoint + 1)).width;
      const change = Math.abs(after - before) / before;

      expect(change, `the rocks snapped ${(change * 100).toFixed(1)}% across ${breakpoint}px`) //
        .toBeLessThan(0.01);
    }
  });
});
