import { test, expect } from "./fixtures";

/**
 * Fish swimming under the hero's waves.
 *
 * Deliberately just two tests - the suite is already slow, so this covers only
 * the invariants that would break silently and that nothing else guards:
 *
 *  1. DOM ORDER IS THE DEPTH. There is no z-index anywhere in this scene. A
 *     fish group is only hidden by the wave rows painted after it, so if
 *     anything ever reorders Waves.tsx - or someone "tidies up" by moving the
 *     groups to the end - the fish pop out on top of the sea, and nothing else
 *     would catch it.
 *  2. THEY LEAVE UNDER REDUCED MOTION, via fishSwim holding their opacity.
 *
 * Everything else about them (colour tokens, per-fish timing, pointer-events)
 * is either visible at a glance or shared with the rest of the scene.
 */

test.describe("fish", () => {
  test("each group is painted before the wave rows that hide it", async ({ homePage, page }) => {
    await homePage.goto();

    // Walk the wave container's children and record what kind each one is.
    // compareDocumentPosition would only give us pairs; the sequence IS the
    // contract, so assert on the whole sequence. This also pins the fish count
    // and both bands being present, so they don't need their own test.
    const order = await page.evaluate(() => {
      const far = document.querySelector('[data-testid="fish-far"]');
      const container = far?.parentElement;
      if (!container) return [];
      return Array.from(container.children).map((el) =>
        el.getAttribute("data-testid") ?? (el.classList.contains("wave-drift") ? "wave" : "?"),
      );
    });

    expect(order).toEqual(["wave", "fish-far", "wave", "fish-mid", "wave", "wave"]);

    // Sparse on purpose: this is a calm sea, not an aquarium. If this number
    // grows, re-run the composited-area budget in mobile.spec.ts.
    await expect(homePage.fishAll).toHaveCount(4);
  });

  test("reduced motion takes them away entirely", async ({ homePage, page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await homePage.goto();

    const first = homePage.fishAll.first();
    await expect(first).toHaveCSS("animation-name", "none");
    // fishSwim is what supplies the opacity, so stopping it hides them rather
    // than freezing a fish mid-water. This is the assertion that matters - the
    // animation-name check above would pass even if .fish were opaque.
    await expect(first).toHaveCSS("opacity", "0");
    // ...while the sea itself keeps drifting.
    await expect(homePage.waveDrift).toHaveCSS("animation-name", /waveDrift/);
  });
});
