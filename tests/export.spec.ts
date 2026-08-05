import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

/**
 * Assertions about the STATIC EXPORT - the ./out directory that GitHub Pages
 * actually serves - rather than about the dev server every other test uses.
 *
 * WHY THIS FILE EXISTS. `next dev` doesn't minify, serves modules instead of
 * built chunks, and will run code that `next build` rejects. So the suite could
 * be entirely green while the thing that ships is broken, and that is not
 * hypothetical here: a CSS minifier once dropped a transform hint out of a
 * keyframe, and nothing caught it, because nothing ever looked at the built
 * output. Verifying fixes meant curling the deployed chunks by hand.
 *
 * These tests run in the "export" project only (see playwright.config.ts),
 * against a small static server that mounts ./out under the Pages base path.
 * One browser is plenty: this is checking what the BUILD produced, not how an
 * engine renders it.
 */

/** Every stylesheet the built page links, concatenated. */
async function builtCss(page: Page): Promise<string> {
  const hrefs = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')].map((l) => l.href),
  );
  expect(hrefs.length, "the export should link at least one stylesheet").toBeGreaterThan(0);

  const sheets = await Promise.all(
    hrefs.map(async (href) => (await page.request.get(href)).text()),
  );
  return sheets.join("\n");
}

test.describe("the static export", () => {
  test("the minifier keeps the rules the scene depends on", async ({ page }) => {
    /*
     * The regression this file was written for. Each of these is a rule that
     * survived being authored but could plausibly be rewritten or dropped by a
     * minifier, and whose loss would be invisible in dev:
     *
     *   • the scroll-reveal transform - the class of thing already lost once
     *   • color-mix() in the dive's water, which several browsers and tools
     *     have historically mangled
     *   • the calc() driving the golden-hour wash off a custom property
     */
    await page.goto("./");
    const css = await builtCss(page);

    expect(css, "the scroll-reveal offset was minified away").toContain("translateY(18px)");
    // The color-mix lives in the --deep-water token, with .deep-sea referring
    // to it - so both halves have to survive, and checking only the rule (as
    // the first draft did) would pass with the token gutted.
    expect(css, "the --deep-water token lost its color-mix()").toMatch(
      /--deep-water:\s*color-mix\(/,
    );
    expect(css, ".deep-sea no longer paints with --deep-water").toMatch(
      /\.deep-sea\{[^}]*background:\s*var\(--deep-water\)/,
    );
    expect(css, "golden hour lost its calc() on --golden").toMatch(
      /\.golden-hour\{[^}]*calc\(var\(--golden/,
    );
    // The waves drift by animating a transform; losing it stops the sea dead.
    expect(css, "the wave drift keyframes lost their transform").toMatch(
      /@keyframes waveDrift[^}]*\{[^@]*translate/,
    );
  });

  test("the theme is decided before the page paints", async ({ page }) => {
    // The no-flash script is inlined into the HTML at build time. If a build
    // change ever moved it into a chunk, the page would paint light and then
    // flip - and only the built output can show that.
    const html = await (await page.request.get("./")).text();
    expect(html).toContain("data-theme");
    expect(html, "the pre-paint theme script is no longer inline").toMatch(
      /<script[^>]*>[^<]*localStorage[^<]*data-theme/s,
    );
  });

  test("everything the manifest promises is actually shipped", async ({ page }) => {
    const manifest = await (await page.request.get("./manifest.json")).json();
    expect(manifest.name).toBeTruthy();
    expect(manifest.icons.length).toBeGreaterThan(0);

    // A manifest pointing at a missing icon is a broken install prompt, and
    // nothing else in the suite opens these files.
    for (const icon of manifest.icons) {
      const response = await page.request.get(`./${icon.src}`);
      expect(response.status(), `manifest icon ${icon.src} is missing`).toBe(200);
    }

    for (const file of ["icon-180.png", "resume.pdf", "clockmaker.html", "ghost-cat.html"]) {
      expect((await page.request.get(`./${file}`)).status(), `${file} is missing`).toBe(200);
    }
  });

  test("the sitemap lists pages that exist", async ({ page }) => {
    const xml = await (await page.request.get("./sitemap.xml")).text();
    const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    expect(urls.length, "the sitemap should list the home page and both games").toBe(3);

    // Follow each one against the export. A sitemap advertising a 404 is worse
    // than no sitemap.
    for (const url of urls) {
      const path = `.${new URL(url).pathname.replace("/FelixFallingCoolSite", "")}`;
      expect((await page.request.get(path)).status(), `${url} 404s`).toBe(200);
    }
  });

  test("robots.txt still shuts the AI crawlers out", async ({ page }) => {
    const robots = await (await page.request.get("./robots.txt")).text();
    expect(robots).toMatch(/GPTBot/i);
    expect(robots).toMatch(/Disallow: \//);
  });

  test("a wrong URL still lands on the lost-at-sea page", async ({ page }) => {
    // Pages serves 404.html for unknown paths; the export has to contain one.
    const response = await page.request.get("./no-such-page");
    expect(response.status()).toBe(404);
    expect(await response.text()).toContain("Lost at sea");
  });

  test("the built bundle runs without console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(String(error)));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });

    /*
     * Third parties are stubbed so this is about OUR bundle: the analytics
     * endpoint 400s until the account is claimed, and the weather API and the
     * contribution chart are someone else's uptime.
     *
     * Fulfilled rather than aborted, which matters more than it looks: an
     * aborted request makes the browser log "Failed to load resource" as a
     * console error, so the first version of this test failed on four errors
     * it had caused itself. Empty successful responses keep the page quiet
     * without pretending the services responded with anything.
     */
    await page.route("**gc.zgo.at**", (route) =>
      route.fulfill({ status: 200, contentType: "text/javascript", body: "" }),
    );
    await page.route("**open-meteo**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: "{}" }),
    );
    await page.route("**ghchart**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "image/gif",
        // A 1x1 transparent GIF - the smallest thing that decodes cleanly.
        body: Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64"),
      }),
    );

    await page.goto("./", { waitUntil: "load" });
    await page.waitForTimeout(1200);

    expect(errors).toEqual([]);
  });
});
