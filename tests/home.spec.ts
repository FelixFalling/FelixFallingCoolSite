import { test, expect } from "@playwright/test";
import { resume } from "../src/data/resume";

/**
 * Smoke tests for the home page: does everything render, link, and navigate?
 *
 * Note the import above — tests read from resume.ts, the same file the site
 * renders from. Update your resume and the tests stay correct automatically.
 */

test.describe("home page", () => {
  test("loads with no browser console errors", async ({ page }) => {
    // Collect any JS errors the page throws while loading — a hydration bug or
    // broken import shows up here long before you'd spot it visually.
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("./");
    await expect(page.locator("h1")).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("shows my name and job title in the hero", async ({ page }) => {
    await page.goto("./");
    await expect(page.locator("h1")).toHaveText(resume.name);
    await expect(page.getByText(resume.jobTitle).first()).toBeVisible();
  });

  test("hero links point at my GitHub and LinkedIn", async ({ page }) => {
    await page.goto("./");
    const hero = page.locator("header");
    await expect(hero.getByRole("link", { name: "GitHub" })).toHaveAttribute(
      "href",
      resume.links.github,
    );
    await expect(hero.getByRole("link", { name: "LinkedIn" })).toHaveAttribute(
      "href",
      resume.links.linkedin,
    );
  });

  test("nav link scrolls to the section", async ({ page }) => {
    await page.goto("./");
    await page.getByRole("navigation").getByRole("link", { name: "Projects" }).click();
    // toBeInViewport = the section actually scrolled onto the screen.
    await expect(page.locator("#projects")).toBeInViewport();
  });

  test("every section renders once scrolled to", async ({ page }) => {
    await page.goto("./");
    for (const id of ["about", "experience", "projects", "education", "skills", "contact"]) {
      const section = page.locator(`#${id}`);
      await section.scrollIntoViewIfNeeded();
      await expect(section).toBeVisible();
    }
  });

  test("the Curse of Ra clock link is there", async ({ page }) => {
    await page.goto("./");
    await expect(page.getByRole("link", { name: /Curse of Ra/ })).toHaveAttribute(
      "href",
      /clockmaker\.html$/,
    );
  });
});

test.describe("reduced motion", () => {
  // Simulate a visitor whose OS is set to "reduce motion" — the waves must
  // freeze for them (that's what the media query in globals.css promises).
  // emulateMedia must run BEFORE goto so the page loads with the setting on.
  test("wave animation is disabled", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("./");
    const wave = page.locator(".wave-drift").first();
    await expect(wave).toHaveCSS("animation-name", "none");
  });
});
