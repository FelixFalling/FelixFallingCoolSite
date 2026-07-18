import type { Page, Locator } from "@playwright/test";

/** Component object for the site footer ("Get in touch"). */
export class Footer {
  readonly root: Locator;
  readonly title: Locator;
  readonly githubLink: Locator;
  readonly linkedinLink: Locator;

  constructor(page: Page) {
    this.root = page.locator("footer");
    this.title = this.root.getByRole("heading", { name: "Get in touch" });
    this.githubLink = this.root.getByRole("link", { name: /github\.com/ });
    this.linkedinLink = this.root.getByRole("link", { name: /linkedin\.com/ });
  }
}
