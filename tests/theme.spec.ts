import { test, expect } from "./fixtures";

/**
 * Tests for the light/dark theme system.
 *
 * The theme lives in one place - the data-theme attribute on <html> - so most
 * of these tests just check that attribute after doing something. Navigation
 * and the toggle go through the HomePage / NavBar page objects.
 */

test.describe("theme", () => {
  test("follows the system preference by default", async ({ homePage, page }) => {
    // emulateMedia pretends the visitor's OS is set to dark mode.
    await page.emulateMedia({ colorScheme: "dark" });
    await homePage.goto();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  });

  test("?theme=light in the URL forces light mode", async ({ homePage, page }) => {
    await page.emulateMedia({ colorScheme: "dark" }); // system says dark…
    await homePage.goto("./", "light"); // …but the URL wins
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  });

  test("the toggle flips the theme and it survives a reload", async ({ homePage, page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await homePage.goto();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

    await homePage.nav.toggleTheme();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

    // Reload - the saved choice in localStorage should stick.
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  });

  test("stars only appear in dark mode", async ({ homePage }) => {
    // The stars' opacity is driven by the --star-opacity token: 0 in light,
    // 1 in dark (set in globals.css, no JavaScript involved).
    await homePage.goto("./", "light");
    await expect(homePage.stars).toHaveCSS("opacity", "0");

    await homePage.goto("./", "dark");
    await expect(homePage.stars).toHaveCSS("opacity", "1");
  });
});
