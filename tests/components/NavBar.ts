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
  /** The link for the section you're currently scrolled to, if any. */
  readonly activeLink: Locator;

  constructor(page: Page) {
    this.root = page.getByRole("navigation");
    this.brand = this.root.getByRole("link", { name: /.+/ }).first();
    this.activeLink = this.root.locator("a[aria-current]");
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

  /** The label of the currently highlighted link ("About", …), or null. */
  async activeLabel(): Promise<string | null> {
    const count = await this.activeLink.count();
    return count === 0 ? null : ((await this.activeLink.first().textContent()) ?? null);
  }

  /** Flip between light and dark mode. */
  async toggleTheme(): Promise<void> {
    await this.themeToggle.click();
  }
}
