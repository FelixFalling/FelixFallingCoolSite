import { test, expect } from "@playwright/test";

/**
 * Tests for the light/dark theme system.
 *
 * The theme lives in one place — the data-theme attribute on <html> — so most
 * of these tests just check that attribute after doing something.
 */

test.describe("theme", () => {
  test("follows the system preference by default", async ({ page }) => {
    // emulateMedia pretends the visitor's OS is set to dark mode.
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("./");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  });

  test("?theme=light in the URL forces light mode", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" }); // system says dark…
    await page.goto("./?theme=light"); // …but the URL wins
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  });

  test("the toggle flips the theme and it survives a reload", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("./");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

    await page.getByRole("button", { name: /switch to dark mode/i }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

    // Reload — the saved choice in localStorage should stick.
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  });

  test("stars only appear in dark mode", async ({ page }) => {
    // The stars' opacity is driven by the --star-opacity token: 0 in light,
    // 1 in dark. data-testid="stars" is set in scene/Stars.tsx.
    await page.goto("./?theme=light");
    await expect(page.getByTestId("stars")).toHaveCSS("opacity", "0");

    await page.goto("./?theme=dark");
    await expect(page.getByTestId("stars")).toHaveCSS("opacity", "1");
  });
});
