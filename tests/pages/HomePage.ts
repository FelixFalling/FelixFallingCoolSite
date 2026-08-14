import type { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";
import { ProjectCard } from "../components/ProjectCard";

/** Page object for the home page - hero, sections, scene, and the easter egg. */
export class HomePage extends BasePage {
  // ── Hero ────────────────────────────────────────────────────────────────
  readonly heroName: Locator;
  readonly githubButton: Locator;
  readonly linkedinButton: Locator;
  readonly resumeButton: Locator;

  // ── Scene ───────────────────────────────────────────────────────────────
  readonly stars: Locator;
  /** The FIRST wave row/swell. waveDriftAll is every row, for counting. */
  readonly waveDrift: Locator;
  readonly waveSwell: Locator;
  readonly waveDriftAll: Locator;
  readonly scrollCue: Locator;
  readonly ducks: Locator;
  /** Every fish in the sea, across both depth bands. */
  readonly fishAll: Locator;

  // ── Accessibility / structure ───────────────────────────────────────────
  readonly skipLink: Locator;
  readonly main: Locator;
  /** The GitHub contribution graph (a third-party image that may fail). */
  readonly activityChart: Locator;

  constructor(page: Page) {
    super(page);
    this.skipLink = page.locator("a.skip-link");
    this.main = page.locator("main#main");
    this.activityChart = page.locator("#activity img");
    const hero = page.locator("header");
    this.heroName = page.locator("h1");
    this.githubButton = hero.getByRole("link", { name: "GitHub" });
    this.linkedinButton = hero.getByRole("link", { name: "LinkedIn" });
    this.resumeButton = hero.getByRole("link", { name: /download resume/i });

    this.stars = page.getByTestId("stars");
    this.waveDrift = page.locator(".wave-drift").first();
    this.waveSwell = page.locator(".wave-swell").first();
    this.waveDriftAll = page.locator(".wave-drift");
    this.scrollCue = page.locator(".scroll-cue");
    this.ducks = page.locator("[data-duck]");
    this.fishAll = page.locator(".fish");
  }

  /** Text matching the hero's job title line. */
  jobTitle(text: string): Locator {
    return this.page.getByText(text).first();
  }

  /** A page section by its id ("about", "projects", "skills", …). */
  section(id: string): Locator {
    return this.page.locator(`#${id}`);
  }

  /** Scroll a section into view (triggers its reveal animation). */
  async scrollToSection(id: string): Promise<void> {
    await this.section(id).scrollIntoViewIfNeeded();
  }

  /** One project card, scoped by its title. */
  projectCard(title: string): ProjectCard {
    return new ProjectCard(this.page, title);
  }

  /** Type the secret word that makes it rain rubber ducks. */
  async typeDuckCode(): Promise<void> {
    await this.page.keyboard.type("duck");
  }

  /**
   * Jump the window to an absolute scroll position, instantly.
   *
   * `behavior: "instant"` matters: the site sets `scroll-behavior: smooth`, so
   * a plain scrollTo animates and anything read straight afterwards describes
   * the page mid-glide rather than where it ended up.
   */
  async scrollTo(y: number): Promise<void> {
    await this.page.evaluate(async (top) => {
      window.scrollTo({ top, behavior: "instant" });
      // The nav's scroll spy updates once per animation frame, so give it a
      // couple of frames to react - otherwise a test reads the highlight from
      // before the scroll and sees a stale (or still-empty) value.
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    }, y);
  }

  /** The furthest the page can scroll (document height minus one screen). */
  async maxScroll(): Promise<number> {
    return this.page.evaluate(
      () => document.documentElement.scrollHeight - window.innerHeight,
    );
  }

  /**
   * Scroll to the bottom and back, so the page settles at its final height.
   *
   * Needed before any test that walks the page by scroll offset: the reveal
   * animations and the lazily-loaded screenshots both change the document
   * height as they come in, so a height measured on a fresh load goes stale
   * underneath you. One round trip triggers them all.
   */
  async settleHeight(): Promise<void> {
    await this.scrollTo(await this.maxScroll());
    await this.page.waitForTimeout(400);
    await this.scrollTo(0);
    await this.page.waitForTimeout(200);
  }

  /** How far the page overflows horizontally (0 = no sideways scrolling). */
  async horizontalOverflow(): Promise<number> {
    return this.page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
  }
}
