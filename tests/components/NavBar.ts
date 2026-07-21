import type { Page, Locator } from "@playwright/test";

/**
 * Component object for the sticky top navigation.
 *
 * A "component object" is a page object for a piece of UI that appears on
 * more than one page - the nav exists on the home page AND the 404 page, so
 * its locators live here once and every page object exposes a NavBar.
 */
export class NavBar {
  readonly root: Locator;
  readonly brand: Locator;
  readonly themeToggle: Locator;

  constructor(page: Page) {
    this.root = page.getByRole("navigation");
    this.brand = this.root.getByRole("link", { name: /.+/ }).first();
    // The toggle's accessible name flips with the theme, so match either.
    this.themeToggle = this.root.getByRole("button", { name: /switch to (dark|light) mode/i });
  }

  /** A nav link by its visible label ("About", "Projects", …). */
  link(label: string): Locator {
    return this.root.getByRole("link", { name: label });
  }

  /** Click a nav link to jump to that section. */
  async clickLink(label: string): Promise<void> {
    await this.link(label).click();
  }

  /** Flip between light and dark mode. */
  async toggleTheme(): Promise<void> {
    await this.themeToggle.click();
  }
}
