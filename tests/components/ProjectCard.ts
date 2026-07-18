import type { Page, Locator } from "@playwright/test";

/**
 * Component object for ONE project card, found by its title. Every locator
 * is scoped to that card's <article>, so tests can't accidentally match a
 * link or image from a different project.
 */
export class ProjectCard {
  readonly root: Locator;

  constructor(page: Page, title: string) {
    this.root = page.locator("article", { hasText: title });
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

  /** Scroll this card into view (triggers lazy-loading of its slides). */
  async scrollTo(): Promise<void> {
    await this.root.scrollIntoViewIfNeeded();
  }
}
