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

  /*
   * Every test runs on a desktop browser and a phone, in BOTH engines.
   *
   * `channel: "chrome"` uses the Google Chrome already installed on your
   * machine (and on GitHub's runners) instead of downloading a browser.
   *
   * WHY WEBKIT IS HERE: it is the engine behind Safari and every browser on
   * iOS. Until it was added, all four projects were Chromium, so the suite
   * could not see a Safari-only bug at all - and this project has already had
   * one: commit 4eff7a1, "stop the waves snapping back on iPhone at each
   * loop", was an iOS rendering bug found by hand because no test could catch
   * it. Animation, backdrop-filter and viewport-unit behaviour are exactly
   * where WebKit diverges, and this site leans on all three.
   *
   * Unlike the Chrome projects, WebKit is a browser Playwright downloads:
   * `npx playwright install webkit` locally, and a step in the CI workflow.
   */
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], channel: "chrome" },
      testIgnore: /export\.spec\.ts/,
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 7"], channel: "chrome" },
      testIgnore: /export\.spec\.ts/,
    },
    {
      name: "desktop-safari",
      use: { ...devices["Desktop Safari"] },
      testIgnore: /export\.spec\.ts/,
    },
    {
      // A real iPhone viewport in the real iOS engine - the combination the
      // wave bug lived in.
      name: "mobile-safari",
      use: { ...devices["iPhone 14"] },
      testIgnore: /export\.spec\.ts/,
    },
    {
      /*
       * The odd one out, and the point of it: every project above runs against
       * `next dev`, which is NOT what ships. Dev doesn't minify, serves modules
       * instead of built chunks, and will happily run code `next build`
       * rejects. That gap has cost this project before - a CSS minifier dropped
       * a transform hint from a keyframe and nothing caught it, because nothing
       * ever looked at the built output.
       *
       * This project points at ./out, served the way Pages serves it, and runs
       * only export.spec.ts - the assertions that are meaningless anywhere else.
       * One browser is enough: it is checking what the BUILD produced, not how
       * an engine renders it.
       */
      name: "export",
      testMatch: /export\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        channel: "chrome",
        baseURL: `http://localhost:${process.env.EXPORT_PORT ?? 3100}/FelixFallingCoolSite/`,
      },
    },
  ],

  // Playwright manages the dev server: starts it before tests, stops it after.
  // `reuseExistingServer` means: if you already have `npm run dev` running
  // locally, tests just use it (faster) - CI always starts a fresh one.
  webServer: [
    {
      command: "npm run dev",
      url: "http://localhost:3000/FelixFallingCoolSite/",
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      // The static export, for the "export" project. It builds first on
      // purpose: serving a stale ./out would quietly test the wrong artifact,
      // which is exactly the failure mode this project exists to prevent. The
      // build is incremental, so it costs seconds after the first run.
      command: "npm run build && node scripts/serve-out-cli.mjs",
      url: `http://localhost:${process.env.EXPORT_PORT ?? 3100}/FelixFallingCoolSite/`,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
  ],
});
