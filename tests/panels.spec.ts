import { test, expect } from "./fixtures";

/**
 * The floating information panels.
 *
 * Three tests, deliberately - the suite is already slow, so this covers only
 * the invariants that would break silently.
 *
 * The history worth knowing: these panels first carried a salvaged-timber
 * texture behind the text. It was hard to read, it was toned down to a third of
 * its strength, and it was STILL hard to read - because the fault was never the
 * strength. Any mark behind body text competes with the text. The look moved to
 * a waterline at the foot of each panel and the text field went flat.
 *
 * So the first test below is the real one: it guards the RESERVED BAND that
 * keeps content out of the water. Without it the waterline would simply be
 * drawn over whatever sits at the bottom of the panel, and we would be back to
 * decoration on top of words by a different route.
 */

test.describe("floating panels", () => {
  test("every panel reserves room for its water, and no content sits in it", async ({
    homePage,
    page,
  }) => {
    await homePage.goto();
    await page.evaluate(() => document.querySelectorAll(".reveal").forEach((e) => e.classList.add("is-visible")));

    const panelCount = await homePage.panels.count();
    expect(panelCount).toBeGreaterThan(0);
    // One waterline per panel - no panel missing one, none doubled up.
    await expect(homePage.waterlines).toHaveCount(panelCount);

    const overlaps = await page.evaluate(() => {
      const band = parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue("--waterline-band"),
      );
      const bad: string[] = [];

      for (const panel of document.querySelectorAll<HTMLElement>(".card, .salvage")) {
        // The band is reserved in padding, not merely painted over.
        const pad = parseFloat(getComputedStyle(panel).paddingBottom);
        if (pad < band) bad.push(`padding-bottom ${pad} < band ${band}`);

        // And nothing actually reaches into it. Walk the leaf elements that
        // carry text and compare against where the water starts.
        const waterTop = panel.getBoundingClientRect().bottom - band;
        for (const el of panel.querySelectorAll<HTMLElement>("p, h2, h3, a, span, div, li")) {
          if (!el.textContent?.trim() || el.children.length) continue;
          const r = el.getBoundingClientRect();
          if (r.height && r.bottom > waterTop + 0.5) {
            bad.push(`"${el.textContent.trim().slice(0, 30)}" reaches ${(r.bottom - waterTop).toFixed(1)}px into the water`);
          }
        }
      }
      return bad;
    });

    expect(overlaps).toEqual([]);
  });

  test("the text field itself is flat - nothing painted behind the words", async ({
    homePage,
    page,
  }) => {
    await homePage.goto();

    const backgrounds = await homePage.panels.evaluateAll((els) =>
      els.map((el) => getComputedStyle(el).backgroundImage),
    );
    // A gradient here is how the timber got in last time. The waterline is an
    // SVG child, not a background, precisely so it cannot creep up behind text.
    expect(backgrounds.every((b) => b === "none")).toBe(true);

    // The tokens the timber ran on should be gone, not merely unused.
    const stale = await page.evaluate(() => {
      const s = getComputedStyle(document.documentElement);
      return ["--timber-seam", "--timber-grain", "--driftwood", "--rivet"].filter(
        (t) => s.getPropertyValue(t).trim() !== "",
      );
    });
    expect(stale).toEqual([]);
  });

  test("reduced motion stops the panels floating", async ({ homePage, page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await homePage.goto();
    await expect(homePage.panels.first()).toHaveCSS("animation-name", "none");
  });
});
