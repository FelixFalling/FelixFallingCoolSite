import { test, expect } from "./fixtures";

/**
 * Phone-specific checks. The whole test suite already runs on a phone-sized
 * browser (the "mobile" project in playwright.config.ts) - these tests are for
 * things that only matter, or only go wrong, on small screens.
 *
 * They're skipped on the desktop project via the isMobile check.
 */

test.describe("phone layout", () => {
  test.beforeEach(async ({ isMobile }) => {
    test.skip(!isMobile, "phone-only checks");
  });

  test("no horizontal scrolling anywhere on the page", async ({ homePage }) => {
    await homePage.goto();
    // If any element pokes past the right edge, the page gets a sideways
    // scrollbar - the classic broken-on-mobile symptom.
    expect(await homePage.horizontalOverflow()).toBe(0);
  });

  test("all nav links are visible and tappable", async ({ homePage }) => {
    await homePage.goto();
    for (const label of ["About", "Projects", "Games", "Skills", "Activity", "Contact"]) {
      await expect(homePage.nav.link(label)).toBeVisible();
    }
  });

  test("hero buttons are big enough to tap (44px)", async ({ homePage }) => {
    await homePage.goto();
    const box = await homePage.githubButton.boundingBox();
    expect(box, "GitHub button should be visible").not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  });

  test("the drifting wave rows stay inside the GPU's texture limit", async ({ homePage, page }) => {
    // Regression guard for "the waves flicker on my phone". Each wave row
    // animates transform, so it becomes a GPU layer rasterized at device-pixel
    // resolution. Mobile GPUs top out around 4096-8192px; past that the browser
    // splits the layer and re-rasterizes it as it moves, which reads as flicker.
    // Waves.module.css keeps the row only as wide as the viewport plus one
    // tile of travel - this fails if that stepping is ever removed.
    await homePage.goto();
    const rows = await page.evaluate(() =>
      [...document.querySelectorAll(".wave-drift")].map((el) => ({
        cssWidth: el.getBoundingClientRect().width,
        devicePx: el.getBoundingClientRect().width * window.devicePixelRatio,
      })),
    );
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row.devicePx, "wave row must fit in one GPU texture").toBeLessThanOrEqual(8192);
      // It still has to cover the screen plus the 1200px the drift travels,
      // or the water would run out mid-loop and leave a bare edge.
      expect(row.cssWidth).toBeGreaterThanOrEqual(page.viewportSize()!.width + 1200);
    }
  });
});
