import { test, expect } from "./fixtures";

/**
 * Phone-specific checks. The whole test suite already runs on a phone-sized
 * browser (the "mobile" project in playwright.config.ts) — these tests are for
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
    // scrollbar — the classic broken-on-mobile symptom.
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
});
