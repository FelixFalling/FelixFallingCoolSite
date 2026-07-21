import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration - how the automated browser tests run.
 *
 * The flow when you run `npm test`:
 *   1. Playwright starts the dev server for you (the `webServer` block below)
 *      and waits until the site responds.
 *   2. It opens real browsers, runs every file in tests/, and reports results.
 *   3. On failure it saves a screenshot + trace you can inspect with
 *      `npx playwright show-report`.
 *
 * Handy commands:
 *   npm test                 run everything headless (no visible browser)
 *   npm run test:ui          interactive mode - watch tests run, time-travel
 *   npx playwright codegen   record clicks into test code (great for learning)
 */
export default defineConfig({
  testDir: "./tests",

  // Each test gets a fresh, isolated browser context (cookies, storage, etc.).
  fullyParallel: true,

  // CI safety nets: fail if someone commits `test.only`, retry flaky tests once.
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,

  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",

  use: {
    // The site lives under the GitHub Pages base path, so tests navigate with
    // page.goto("./") - meaning "the baseURL directory" - rather than "/".
    baseURL: "http://localhost:3000/FelixFallingCoolSite/",

    // Record a trace (screenshots + actions + console) when a test fails.
    trace: "retain-on-failure",
  },

  // Run every test twice: once as a desktop browser, once as a phone.
  // `channel: "chrome"` uses the Google Chrome already installed on your
  // machine (and on GitHub's runners) instead of downloading a browser.
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], channel: "chrome" },
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 7"], channel: "chrome" },
    },
  ],

  // Playwright manages the dev server: starts it before tests, stops it after.
  // `reuseExistingServer` means: if you already have `npm run dev` running
  // locally, tests just use it (faster) - CI always starts a fresh one.
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000/FelixFallingCoolSite/",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
