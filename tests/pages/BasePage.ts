import type { Page } from "@playwright/test";
import { NavBar } from "../components/NavBar";
import { Footer } from "../components/Footer";

/**
 * The base every page object extends.
 *
 * Page Object Model in one sentence: each page of the site gets a class that
 * owns its locators and user actions, so tests read like user stories and a
 * selector only ever has to change in ONE place. Convention used throughout
 * this framework: page objects hold locators + actions, the assertions stay
 * in the spec files.
 */
export class BasePage {
  readonly page: Page;
  readonly nav: NavBar;
  readonly footer: Footer;

  constructor(page: Page) {
    this.page = page;
    this.nav = new NavBar(page);
    this.footer = new Footer(page);
  }

  /**
   * Navigate relative to the configured baseURL (which already includes the
   * GitHub Pages base path - see playwright.config.ts). An optional theme
   * query forces light or dark mode for the visit.
   */
  async goto(path = "./", theme?: "light" | "dark"): Promise<void> {
    await this.page.goto(theme ? `${path}?theme=${theme}` : path);
    await this.dismissConstructionPopup();
  }

  /**
   * The under-construction popup (ConstructionPopup.tsx) covers the page and
   * blocks clicks until it's closed. It only shows once per browser (via
   * localStorage) and only on the home page, so most navigations won't find
   * it - this is a no-op when it doesn't appear.
   */
  private async dismissConstructionPopup(): Promise<void> {
    const dismiss = this.page.getByRole("button", { name: "Dismiss this notice" });
    try {
      await dismiss.waitFor({ state: "visible", timeout: 2000 });
      await dismiss.click();
    } catch {
      // didn't show - already dismissed this session, or this page has none
    }
  }
}
