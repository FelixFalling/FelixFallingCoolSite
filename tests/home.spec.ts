import { test, expect } from "./fixtures";
import { resume, primaryProjectLink } from "../src/data/resume";

/**
 * Smoke tests for the home page: does everything render, link, and navigate?
 *
 * Two things to notice about how these are written:
 * 1. They receive `homePage` — a page object from fixtures.ts. All locators
 *    live in tests/pages/HomePage.ts; the specs just act and assert.
 * 2. They import resume.ts — the same data the site renders from — so
 *    updating your resume never breaks a test.
 */

test.describe("home page", () => {
  test("loads with no browser console errors", async ({ homePage, page }) => {
    // Collect any JS errors the page throws while loading — a hydration bug or
    // broken import shows up here long before you'd spot it visually.
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await homePage.goto();
    await expect(homePage.heroName).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("shows my name and job title in the hero", async ({ homePage }) => {
    await homePage.goto();
    await expect(homePage.heroName).toHaveText(resume.name);
    await expect(homePage.jobTitle(resume.jobTitle)).toBeVisible();
  });

  test("hero links match the data file", async ({ homePage }) => {
    await homePage.goto();
    await expect(homePage.githubButton).toHaveAttribute("href", resume.links.github);
    // LinkedIn is optional (and currently hidden for privacy) — the button
    // must only exist when the data file provides a URL.
    if (resume.links.linkedin) {
      await expect(homePage.linkedinButton).toHaveAttribute("href", resume.links.linkedin);
    } else {
      await expect(homePage.linkedinButton).toHaveCount(0);
    }
  });

  test("nav link scrolls to the section", async ({ homePage }) => {
    await homePage.goto();
    await homePage.nav.clickLink("Projects");
    // toBeInViewport = the section actually scrolled onto the screen.
    await expect(homePage.section("projects")).toBeInViewport();
  });

  test("every section renders once scrolled to", async ({ homePage }) => {
    await homePage.goto();
    // Experience/Education are intentionally hidden for now (see page.tsx).
    for (const id of ["about", "projects", "games", "skills", "activity", "contact"]) {
      await homePage.scrollToSection(id);
      await expect(homePage.section(id)).toBeVisible();
    }
  });

  test("each project card shows its screenshots and link", async ({ homePage }) => {
    await homePage.goto();
    await homePage.scrollToSection("projects");
    // Projects and Games render through the same ProjectCards component, so
    // one loop covers every card in both sections.
    for (const project of [...resume.projects, ...resume.games]) {
      const card = homePage.projectCard(project.title);
      if (project.images?.length) {
        // Slides load lazily, so scroll the card into view and poll until the
        // browser has actually fetched the file (naturalWidth > 0).
        const alt = project.images[0].alt;
        await card.scrollTo();
        await expect(card.slideImage(alt)).toBeVisible();
        await expect
          .poll(() => card.slideHasLoaded(alt), {
            message: `${project.title} screenshot should load`,
          })
          .toBe(true);
      }
      for (const link of project.links ?? []) {
        await expect(card.link(link.label)).toHaveAttribute("href", link.href);
      }
      // Clicking a screenshot opens the project — its code link when it has
      // one (primaryProjectLink is the same helper the site renders with).
      const primary = primaryProjectLink(project);
      if (project.images?.length && primary) {
        await expect(card.slideLink).toHaveAttribute("href", primary.href);
      }
    }
  });

  test("the Curse of Ra clock link is there", async ({ homePage }) => {
    await homePage.goto();
    await expect(homePage.curseOfRaLink).toHaveAttribute("href", /clockmaker\.html$/);
  });
});

test.describe("easter egg", () => {
  test("typing 'duck' makes it rain ducks", async ({ homePage }) => {
    await homePage.goto();
    await expect(homePage.ducks).toHaveCount(0);
    await homePage.typeDuckCode();
    // The flock spawns 16 ducks that fall, bob, and fade away.
    await expect(homePage.ducks).toHaveCount(16);
  });
});

test.describe("404 page", () => {
  test("wrong URLs land on the lost-at-sea page with a way home", async ({
    notFoundPage,
    homePage,
  }) => {
    await notFoundPage.goto();
    await expect(notFoundPage.heading).toBeVisible();
    await notFoundPage.backToShoreButton.click();
    await expect(homePage.heroName).toHaveText(resume.name);
  });
});

test.describe("reduced motion", () => {
  // Simulate a visitor whose OS is set to "reduce motion". Policy (see the
  // media query in globals.css): the gentle horizontal drift KEEPS moving —
  // it's the site's identity and calm enough — while the springier vertical
  // swell (and beam, gulls, parallax, ducks) stops.
  // emulateMedia must run BEFORE goto so the page loads with the setting on.
  test("swell stops but the gentle drift keeps flowing", async ({ homePage, page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await homePage.goto();
    await expect(homePage.waveSwell).toHaveCSS("animation-name", "none");
    await expect(homePage.waveDrift).toHaveCSS("animation-name", /waveDrift/);
  });
});
