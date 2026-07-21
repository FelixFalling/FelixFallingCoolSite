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
  /** The swash: water running up the beach (Swash.tsx). */
  readonly swashRun: Locator;
  readonly swashFoam: Locator;
  readonly wetSand: Locator;
  readonly scrollCue: Locator;
  readonly ducks: Locator;

  constructor(page: Page) {
    super(page);
    const hero = page.locator("header");
    this.heroName = page.locator("h1");
    this.githubButton = hero.getByRole("link", { name: "GitHub" });
    this.linkedinButton = hero.getByRole("link", { name: "LinkedIn" });
    this.resumeButton = hero.getByRole("link", { name: /download resume/i });

    this.stars = page.getByTestId("stars");
    this.waveDrift = page.locator(".wave-drift").first();
    this.waveSwell = page.locator(".wave-swell").first();
    this.waveDriftAll = page.locator(".wave-drift");
    this.swashRun = page.locator(".swash-run");
    this.swashFoam = page.locator(".swash-foam");
    this.wetSand = page.locator(".wet-sand");
    this.scrollCue = page.locator(".scroll-cue");
    this.ducks = page.locator("[data-duck]");
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

  /** How far the page overflows horizontally (0 = no sideways scrolling). */
  async horizontalOverflow(): Promise<number> {
    return this.page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
  }
}
