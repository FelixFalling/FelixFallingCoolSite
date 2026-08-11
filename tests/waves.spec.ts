import { test, expect } from "./fixtures";

/**
 * The two invariants the wave geometry rests on. Neither had a test, and both
 * are the kind that break silently - you get a flaw that only shows up at one
 * scroll position, on one screen width, in one theme.
 *
 * The crests are built as sums of sines (see Waves.tsx). That buys a lot: each
 * layer can have its own rhythm instead of all four being one shape rescaled.
 * It also puts real weight on the arithmetic, which is what these guard.
 */

/** Pull each layer's crest out of the DOM: the `d` of the first tile's fill
 *  path, minus the two lines that close it off at the bottom. */
async function crestPaths(page: import("@playwright/test").Page) {
  return page.evaluate(() =>
    [...document.querySelectorAll(".wave-drift")].map((row) => {
      const d = row.querySelector("svg path")!.getAttribute("d")!;
      return d.replace(/ L1200 200 L0 200 Z$/, "");
    }),
  );
}

test.describe("the wave geometry", () => {
  test("every tile meets the next one without a seam", async ({ homePage, page }) => {
    /*
     * The drift animation slides a row left by exactly one tile and loops. That
     * is only invisible if each crest ENDS where it STARTS - so the harmonics
     * have to be whole cycles per tile. A fractional one would leave a step at
     * every tile boundary, marching across the screen once per loop.
     *
     * Checked on the emitted path rather than the numbers that produced it,
     * because rounding the coordinates could reintroduce a step on its own.
     */
    await homePage.goto();
    const paths = await crestPaths(page);
    expect(paths).toHaveLength(4);

    for (const [i, d] of paths.entries()) {
      const start = d.match(/^M0 (-?[\d.]+)/);
      expect(start, `layer ${i} does not start at x=0`).not.toBeNull();

      // The last cubic's endpoint is where the tile hands over to the next.
      const segments = d.split(" C");
      const end = segments[segments.length - 1].split(",").pop()!.trim().split(" ");
      const [endX, endY] = end.map(Number);

      expect(endX, `layer ${i} does not end at the tile's edge`).toBe(1200);
      expect(Number(endY), `layer ${i} has a step of ${(endY - Number(start![1])).toFixed(2)}px at the tile seam`) //
        .toBeCloseTo(Number(start![1]), 1);
    }
  });

  test("the mid layer never rises above the far one", async ({ homePage, page }) => {
    /*
     * Not an aesthetic rule - the two layers in front of it ARE allowed to rise
     * clear of what is behind them, and it reads as depth when they do.
     *
     * This specific pair is different because of how the water is coloured.
     * Every layer is drawn opaque, in a colour pre-mixed over the layer behind
     * it (--wave-*-solid in globals.css). Where a layer rises clear of its
     * predecessor that assumption is wrong and the colour is slightly off. For
     * the near layers the error is a fraction of a fraction and invisible;
     * between mid and far it is the largest in the chain, and it would land on
     * the sea's top edge, against the sky, where it is easiest to see. So the
     * amplitudes are chosen to make it impossible rather than merely unlikely.
     */
    await homePage.goto();

    const { farBottom, midTop } = await page.evaluate(() => {
      // Sample the real curves through the browser's own geometry engine, so
      // this measures what is drawn and not a second implementation of it.
      const svg = document.querySelector(".wave-drift svg")!;
      const sample = (d: string) => {
        const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
        p.setAttribute("d", d);
        svg.appendChild(p);
        const len = p.getTotalLength();
        const ys = Array.from({ length: 600 }, (_, i) => p.getPointAtLength((i / 599) * len).y);
        p.remove();
        return ys;
      };

      const crest = (row: number) => {
        const d = document.querySelectorAll(".wave-drift")[row].querySelector("svg path")!.getAttribute("d")!;
        return sample(d.replace(/ L1200 200 L0 200 Z$/, ""));
      };

      // y grows downward: the "bottom" of a crest is its largest y.
      return { farBottom: Math.max(...crest(0)), midTop: Math.min(...crest(1)) };
    });

    expect(midTop, `mid rises ${(farBottom - midTop).toFixed(1)}px above far's lowest trough`) //
      .toBeGreaterThan(farBottom);
  });
});
