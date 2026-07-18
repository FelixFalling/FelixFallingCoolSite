import { test, expect } from "@playwright/test";

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

  test("no horizontal scrolling anywhere on the page", async ({ page }) => {
    await page.goto("./");
    // If any element pokes past the right edge, the page gets a sideways
    // scrollbar — the classic broken-on-mobile symptom.
    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth - document.documentElement.clientWidth;
    });
    expect(overflow).toBe(0);
  });

  test("all nav links are visible and tappable", async ({ page }) => {
    await page.goto("./");
    const nav = page.getByRole("navigation");
    for (const label of ["About", "Experience", "Projects", "Education", "Skills", "Contact"]) {
      await expect(nav.getByRole("link", { name: label })).toBeVisible();
    }
  });

  test("hero buttons are big enough to tap (44px)", async ({ page }) => {
    await page.goto("./");
    const github = page.locator("header").getByRole("link", { name: "GitHub" });
    const box = await github.boundingBox();
    expect(box, "GitHub button should be visible").not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  });
});
