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

  test("the swash sheets never become tiled rows", async ({ homePage, page }) => {
    // The swash only moves up and down, so unlike the wave rows it never needs
    // to be wider than the screen. The width assertion is the valuable half:
    // it fails loudly if someone ever "fixes" the swash by tiling it, which
    // would multiply GPU layer memory in the busiest part of the page.
    await homePage.goto();
    const layers = await page.evaluate(() =>
      [...document.querySelectorAll(".swash-run, .wet-sand")].map((el) => ({
        cssWidth: el.getBoundingClientRect().width,
        devicePx: el.getBoundingClientRect().width * window.devicePixelRatio,
      })),
    );
    expect(layers.length).toBeGreaterThan(0);
    const viewport = page.viewportSize()!.width;
    for (const layer of layers) {
      expect(layer.devicePx, "swash layer must fit in one GPU texture").toBeLessThanOrEqual(8192);
      expect(layer.cssWidth, "swash must not be tiled").toBeLessThanOrEqual(viewport * 1.25);
    }
  });

  test("the water never reaches the hero's bottom cut", async ({ homePage, page }) => {
    // The hero clips its overflow, so a sheet that ran too far would get its
    // leading edge sliced off in a dead-straight line. Swash.tsx caps the run
    // with a min(); this proves the cap is doing its job.
    await homePage.goto();
    const px = await page.evaluate(() => {
      const probe = (value: string) => {
        const el = document.createElement("div");
        el.style.cssText = `position:absolute;visibility:hidden;height:${value}`;
        document.querySelector(".waves-strip")!.appendChild(el);
        const h = el.getBoundingClientRect().height;
        el.remove();
        return h;
      };
      const sheet = document.querySelector(".swash-run") as HTMLElement;
      const up = getComputedStyle(sheet).getPropertyValue("--swash-up");
      return { waterline: probe("var(--waterline)"), up: probe(up) };
    });
    expect(px.waterline).toBeGreaterThan(0);
    expect(px.up, "the run-up must stop short of the hero's edge").toBeLessThanOrEqual(px.waterline - 20);
  });

  test("the animated scene stays inside a sane GPU budget", async ({ homePage, page }) => {
    // Per-element width checks miss the thing that actually hurts: the total.
    // Everything here is promoted to its own layer because it animates
    // transform, and each one is rasterized at device-pixel resolution.
    await homePage.goto();
    const megapixels = await page.evaluate(() => {
      const dpr = window.devicePixelRatio;
      return (
        [...document.querySelectorAll(".wave-drift, .swash-run, .wet-sand")].reduce((total, el) => {
          const b = el.getBoundingClientRect();
          return total + b.width * b.height * dpr * dpr;
        }, 0) / 1e6
      );
    });
    expect(megapixels).toBeGreaterThan(0);
    expect(megapixels, "composited scene layers").toBeLessThanOrEqual(16);
  });
});
