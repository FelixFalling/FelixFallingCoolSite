import { test, expect } from "./fixtures";
import type { Page } from "@playwright/test";

/**
 * The shoreline's geometry.
 *
 * This file used to also assert that the rocks were SUBMERGED - hung off a
 * computed --waterline so the front wave crossed each one's foot by the same
 * amount at every width. The maths worked and the result looked worse: the
 * rocks read as half-sunk and the scene lost its shoreline. The clusters are
 * back on the water at their original offsets (`bottom: Npx + --shore-lift`),
 * so those two assertions are gone deliberately - don't reinstate them without
 * looking at the page first.
 *
 * What remains is the part that was a real bug either way: the rocks must not
 * SNAP size while a window is being dragged.
 */

/** The headland cluster's width at a given viewport width. */
async function shoreAt(page: Page, width: number) {
  await page.setViewportSize({ width, height: 900 });
  await page.waitForTimeout(350); // let the clamp()s settle
  return page.evaluate(() => {
    const rock = document.querySelector('svg[viewBox="0 0 360 240"]')!.getBoundingClientRect();
    return { width: rock.width };
  });
}

test.describe("the shoreline", () => {
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

test.describe("the rocks are solid", () => {
  test("nothing shows through them", async ({ homePage, page }) => {
    /*
     * The sea stacks used to fake distance with opacity (0.85 / 0.8 / 0.4), and
     * a translucent rock is a rock you can see through - the lighthouse beam
     * and the far stack showed straight through the headland. It is barely
     * visible in light fog and obvious against the dark sky, which is where it
     * was caught. Distance is a colour now (--sea-stack-* in globals.css), so
     * any opacity back on these wrappers is the bug returning.
     */
    await homePage.goto("./", "dark");

    const alphas = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('[aria-hidden="true"] svg')]
        .map((svg) => svg.parentElement!)
        .filter((el) => el.style.left) // the Cluster wrappers position by left
        .map((el) => getComputedStyle(el).opacity),
    );

    expect(alphas.length).toBeGreaterThan(0);
    expect(alphas.every((a) => a === "1")).toBe(true);
  });
});
