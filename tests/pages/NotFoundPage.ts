import type { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/** Page object for the "Lost at sea" 404 page. */
export class NotFoundPage extends BasePage {
  readonly heading: Locator;
  readonly backToShoreButton: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole("heading", { name: "Lost at sea" });
    this.backToShoreButton = page.getByRole("link", { name: "← Back to shore" });
  }

  /** Visit a URL that doesn't exist, landing on the 404 page. */
  async goto(): Promise<void> {
    await super.goto("./this-page-does-not-exist/");
  }
}
