import type { Page, Locator } from "@playwright/test";

/**
 * Component object for ONE project card, found by its title. Every locator
 * is scoped to that card's <article>, so tests can't accidentally match a
 * link or image from a different project.
 */
export class ProjectCard {
  readonly root: Locator;
  readonly title: string;

  constructor(page: Page, title: string) {
    this.root = page.locator("article", { hasText: title });
    this.title = title;
  }

  /** The clickable screenshot link (every slide links to the project). */
  get slideLink(): Locator {
    return this.root.getByRole("link", { name: `Open project: ${this.title}` }).first();
  }

  /** A project link by its visible label ("View the code →", …). */
  link(label: string): Locator {
    return this.root.getByRole("link", { name: label });
  }

  /** A slideshow image by its alt text. */
  slideImage(alt: string): Locator {
    return this.root.getByRole("img", { name: alt });
  }

  /** True once the given slide's image file has actually loaded. */
  async slideHasLoaded(alt: string): Promise<boolean> {
    return this.slideImage(alt).evaluate((el) => (el as HTMLImageElement).naturalWidth > 0);
  }

  /**
   * Scroll this card into view (triggers lazy-loading of its slides).
   *
   * WHY NOT scrollIntoViewIfNeeded(). That is an *actionability* call: before
   * scrolling, Playwright waits for the element to be "stable", meaning its
   * bounding box is unchanged across two consecutive animation frames. These
   * cards carry `.adrift` (globals.css), which bobs them up and down on an
   * `infinite` animation - so they are never stable, and the wait can only
   * succeed if it happens to sample the animation at a turning point where the
   * movement rounds to zero pixels. That made this the flakiest test in the
   * suite: it passed or timed out after 30s depending on machine speed and
   * luck, with the unhelpful message "element is not stable".
   *
   * A plain DOM scrollIntoView has no actionability wait, and nothing here
   * needs one - the test is not clicking the card, only bringing it into the
   * viewport so the browser starts fetching its lazy images. The assertions
   * that follow do the real waiting.
   */
  async scrollTo(): Promise<void> {
    await this.root.evaluate((el) => el.scrollIntoView({ block: "center" }));
  }
}
