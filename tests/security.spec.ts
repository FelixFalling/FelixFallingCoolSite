import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { createHash } from "node:crypto";
import { THIRD_PARTY, allOrigins } from "../thirdParty.mjs";

/**
 * ─────────────────────────────────────────────────────────────────────────
 *  SECURITY. Assertions about the artifact that actually ships.
 * ─────────────────────────────────────────────────────────────────────────
 *
 *  Every test in this file runs against ./out - the static export GitHub Pages
 *  serves - and not against `next dev`. That is not a detail: the dev server
 *  sends no Content-Security-Policy at all, because the policy is written by
 *  scripts/csp.mjs as the second half of `npm run build`. A security suite
 *  pointed at dev would pass while shipping nothing.
 *
 *  WHAT THIS FILE IS FOR. The protections on this site are all of the kind
 *  that fail silently. An integrity hash that goes stale, a CSP that quietly
 *  stops covering a page, a new <a target="_blank"> written without its rel -
 *  none of these break anything visible, so none of them get noticed. Each
 *  test below turns one of those into a red build.
 *
 *  The pages under test:
 *    /                 the Next-built home page
 *    /404.html         the Next-built error page
 *    /clockmaker.html  hand-written; loads three.js from a CDN
 *    /ghost-cat.html   hand-written; no third-party scripts
 */

/** Every page in the export, with the page-kind scripts/csp.mjs assigns it. */
const PAGES = [
  { path: "./", name: "home", kind: "next" },
  { path: "./404.html", name: "404", kind: "next" },
  { path: "./clockmaker.html", name: "clockmaker", kind: "clockmaker" },
  { path: "./ghost-cat.html", name: "ghost-cat", kind: "ghost-cat" },
] as const;

/** Fetch a page's raw HTML without executing it. */
async function rawHtml(page: Page, path: string): Promise<string> {
  const response = await page.request.get(path);
  expect(response.status(), `${path} should be served`).toBe(200);
  return response.text();
}

/** The content of a page's CSP meta tag, as a directive → sources map. */
function parsePolicy(html: string): Map<string, string[]> {
  const match = /<meta http-equiv="Content-Security-Policy" content="([^"]*)">/i.exec(html);
  expect(match, "the page carries no Content-Security-Policy meta tag").not.toBeNull();

  const policy = new Map<string, string[]>();
  for (const part of match![1].split(";")) {
    const [directive, ...sources] = part.trim().split(/\s+/);
    if (directive) policy.set(directive, sources);
  }
  return policy;
}

/* ══════════════════════════════════════════════════════════════════════════
 *  1. The Content-Security-Policy
 * ══════════════════════════════════════════════════════════════════════════ */

test.describe("content security policy", () => {
  for (const { path, name } of PAGES) {
    test(`${name} ships a policy with no unsafe script sources`, async ({ page }) => {
      const policy = parsePolicy(await rawHtml(page, path));

      /*
       * The two tokens that would make the rest of the policy decorative.
       * 'unsafe-inline' would let injected markup run; 'unsafe-eval' would let
       * a string be turned back into code. Neither is needed here: inline
       * scripts run by hash instead.
       */
      const scriptSrc = policy.get("script-src") ?? [];
      expect(scriptSrc, `${name}: script-src allows 'unsafe-inline'`).not.toContain(
        "'unsafe-inline'",
      );
      expect(scriptSrc, `${name}: script-src allows 'unsafe-eval'`).not.toContain("'unsafe-eval'");
      expect(scriptSrc, `${name}: script-src allows any origin`).not.toContain("*");

      /*
       * Inline scripts must be permitted by hash - that is the mechanism that
       * lets the two tokens above stay out of the policy. Checked against the
       * page's ACTUAL inline-script count rather than asserting "at least one":
       * a page that legitimately had none would fail a blanket assertion, and
       * more importantly this catches the case that matters, which is a page
       * whose scripts exist but whose hashes were not emitted - every script
       * on it silently blocked.
       */
      const html = await rawHtml(page, path);
      const inlineCount = [
        ...html.matchAll(/<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/gi),
      ].filter((m) => m[1].trim().length > 0).length;
      const hashes = scriptSrc.filter((source) => source.startsWith("'sha256-"));

      if (inlineCount > 0) {
        expect(
          hashes.length,
          `${name} has ${inlineCount} inline script(s) but the policy names no hashes — every one of them is blocked`,
        ).toBeGreaterThan(0);
      }

      // The capabilities this site never uses, denied outright.
      expect(policy.get("object-src")).toEqual(["'none'"]);
      expect(policy.get("form-action")).toEqual(["'none'"]);
      expect(policy.get("frame-src")).toEqual(["'none'"]);
      expect(policy.get("worker-src")).toEqual(["'none'"]);
      expect(policy.get("base-uri")).toEqual(["'self'"]);
      expect(policy.has("upgrade-insecure-requests")).toBe(true);
      expect(policy.get("default-src")).toEqual(["'self'"]);
    });

    test(`${name} loads with zero CSP violations`, async ({ page }) => {
      /*
       * THE TEST THAT MATTERS MOST IN THIS FILE.
       *
       * Everything else here checks the policy's text. This one checks its
       * EFFECT: it loads the real page in a real browser and asks the browser
       * whether the policy blocked anything the page needed. A policy that is
       * too strict does not fail loudly - the theme script silently does not
       * run, or a chunk silently does not load - so without this test a
       * mistake in scripts/csp.mjs would reach the deployed site looking fine
       * in dev and broken in production.
       */
      await page.addInitScript(() => {
        const violations: string[] = [];
        (window as unknown as { __csp: string[] }).__csp = violations;
        document.addEventListener("securitypolicyviolation", (event) => {
          violations.push(
            `${event.effectiveDirective} blocked ${event.blockedURI || "(inline)"}` +
              (event.sample ? ` — sample: ${event.sample.slice(0, 80)}` : ""),
          );
        });
      });

      /*
       * Third parties are stubbed so this test is about OUR policy and not
       * about someone else's uptime - the same reasoning as the console-error
       * test in export.spec.ts.
       *
       * This does NOT weaken the check, and the reason is worth stating: CSP
       * is enforced in the renderer BEFORE a request is made, so anything the
       * policy blocks never reaches route interception at all. A stub can
       * therefore only be consulted for a request the policy already allowed.
       *
       * The analytics script is aborted rather than stubbed, because it is
       * pinned with an integrity hash - a stub body would fail that hash and
       * be blocked, which is the SRI working correctly but would muddy what
       * this test is reading.
       */
      await page.route("**gc.zgo.at**", (route) => route.abort());
      await page.route("**open-meteo**", (route) =>
        route.fulfill({ status: 200, contentType: "application/json", body: "{}" }),
      );
      await page.route("**ghchart**", (route) =>
        route.fulfill({
          status: 200,
          contentType: "image/gif",
          body: Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64"),
        }),
      );

      await page.goto(path, { waitUntil: "load" });
      // Long enough for deferred work - hydration, the async analytics tag,
      // lazy images - to have had its chance to violate the policy.
      await page.waitForTimeout(1500);

      const violations = await page.evaluate(
        () => (window as unknown as { __csp: string[] }).__csp,
      );
      expect(violations, `${name} triggered CSP violations`).toEqual([]);
    });
  }

  test("the policy permits every third party the site actually uses", async ({ page }) => {
    /*
     * The mirror image of the tests above. Those prove the policy is not too
     * loose; this proves it is not too tight - that every service named in
     * thirdParty.mjs is actually allowed on the pages that use it.
     *
     * Checked as text rather than by loading the services, so it is fast,
     * deterministic, and works offline: a missing origin is a missing origin
     * whether or not the service happens to be up.
     */
    for (const { path, name, kind } of PAGES) {
      const policy = parsePolicy(await rawHtml(page, path));

      for (const [key, service] of Object.entries(THIRD_PARTY)) {
        if (!(service.pages ?? []).includes(kind)) continue;

        for (const directive of service.csp) {
          expect(
            policy.get(directive) ?? [],
            `${name}: ${directive} does not allow ${key} (${service.origin}) — ${service.why}`,
          ).toContain(service.origin);
        }
      }
    }
  });

  test("the policy tag is the first thing in <head>", async ({ page }) => {
    /*
     * Position is load-bearing. A meta CSP governs only what the parser sees
     * AFTER it, so a tag placed lower leaves everything above it unprotected -
     * and a stylesheet or preconnect drifting above the policy is exactly the
     * kind of change nobody would think to check.
     */
    for (const { path, name } of PAGES) {
      const html = await rawHtml(page, path);
      const head = html.indexOf("<head");
      const headEnd = html.indexOf(">", head);
      const afterHead = html.slice(headEnd + 1).trimStart();
      expect(afterHead.startsWith("<meta http-equiv=\"Content-Security-Policy\""), `${name}: something precedes the CSP inside <head>`).toBe(true);
    }
  });

  test("no page carries two policies", async ({ page }) => {
    // Two CSP tags both apply and the browser enforces their INTERSECTION,
    // which is a confusing way to break a page. scripts/csp.mjs strips any
    // previous tag before writing; this proves it.
    for (const { path, name } of PAGES) {
      const html = await rawHtml(page, path);
      const count = html.match(/http-equiv="Content-Security-Policy"/gi)?.length ?? 0;
      expect(count, `${name} has ${count} CSP tags`).toBe(1);
    }
  });
});

/* ══════════════════════════════════════════════════════════════════════════
 *  2. Third-party code
 * ══════════════════════════════════════════════════════════════════════════ */

test.describe("third-party code", () => {
  test("every third-party script is pinned with an integrity hash", async ({ page }) => {
    /*
     * A <script src> pointing at someone else's server is a standing grant of
     * code execution on this site. `integrity` converts that into a grant to
     * run ONE known file: the browser hashes what it downloaded and refuses
     * anything else.
     *
     * This test parses the shipped HTML rather than trusting the source,
     * because the source is not what ships - the game pages are copied
     * verbatim and the Next pages are rebuilt.
     */
    for (const { path, name } of PAGES) {
      const html = await rawHtml(page, path);
      const tags = [...html.matchAll(/<script\b[^>]*\ssrc=["']([^"']+)["'][^>]*>/gi)];

      for (const [tag, src] of tags) {
        if (!/^https?:\/\//i.test(src)) continue; // same-origin chunks: not third party

        expect(tag, `${name}: <script src="${src}"> has no integrity attribute`).toMatch(
          /\sintegrity=["']sha(256|384|512)-/,
        );
        // Without crossorigin the browser will not perform the check at all -
        // it blocks the script instead. An integrity attribute without this
        // one is not a weaker control, it is a broken page.
        expect(tag, `${name}: <script src="${src}"> has integrity but no crossorigin`).toMatch(
          /\scrossorigin=/,
        );
      }
    }
  });

  test("the integrity hash in the markup matches the inventory", async ({ page }) => {
    /*
     * The cross-check between the two places a pin is written down.
     *
     * thirdParty.mjs records the hash, but it is not what the browser reads -
     * the browser reads the `integrity` attribute in the shipped HTML. For the
     * Next pages those agree because layout.tsx interpolates the constant, but
     * public/clockmaker.html is hand-written and CANNOT import from the
     * inventory: its hash is typed out by hand, so it can be typed wrong, or
     * left behind when the inventory is updated.
     *
     * Either way the symptom is the same and it is quiet: the browser refuses
     * the script and the clock page shows its own error banner, on the
     * deployed site only. This test is what turns that into a build failure.
     * (It was added because a deliberately corrupted hash passed every other
     * test in this file.)
     */
    const pinned = Object.entries(THIRD_PARTY).filter(([, service]) => service.integrity);

    for (const { path, name } of PAGES) {
      const html = await rawHtml(page, path);
      const tags = [...html.matchAll(/<script\b[^>]*\ssrc=["']([^"']+)["'][^>]*>/gi)];

      for (const [tag, src] of tags) {
        if (!/^https?:\/\//i.test(src)) continue;

        const entry = pinned.find(([, service]) => service.url === src);
        expect(
          entry,
          `${name}: <script src="${src}"> is pinned in the markup but that exact URL is not in thirdParty.mjs`,
        ).toBeDefined();

        const [key, service] = entry!;
        const inMarkup = /\sintegrity=["']([^"']+)["']/i.exec(tag)?.[1];
        expect(
          inMarkup,
          `${name}: the integrity hash on ${key} does not match thirdParty.mjs.\n` +
            `  markup:    ${inMarkup}\n` +
            `  inventory: ${service.integrity}\n` +
            `One of the two was changed without the other. The browser reads the markup,\n` +
            `so if the markup is the stale one the script is being REFUSED on the live site.`,
        ).toBe(service.integrity);
      }
    }
  });

  test("the shipped pages contact nothing outside the inventory", async ({ page }) => {
    /*
     * The control that makes thirdParty.mjs real. Anyone can add a CDN link to
     * a page; this notices. It scans the built HTML for external origins and
     * fails on any that the inventory does not list, so a new third party
     * cannot be introduced without also being declared, allowed in the CSP,
     * and explained in one line.
     */
    const known = new Set(allOrigins());
    // Origins that appear as text rather than as something the browser
    // fetches: profile links, the site's own canonical URL, XML namespaces.
    const linkedNotLoaded = new Set([
      "https://github.com",
      "https://www.youtube.com",
      "https://wdt.cecs.pdx.edu",
      "https://felixfalling.github.io",
      "http://www.w3.org",
      "https://www.w3.org",
    ]);

    for (const { path, name } of PAGES) {
      const html = await rawHtml(page, path);

      // Only attributes the browser actually FETCHES - src, href on <link>,
      // and url() in inline CSS. A URL in visible text or in a comment is not
      // a third party.
      const fetched = [
        ...html.matchAll(/\bsrc=["'](https?:\/\/[^"']+)["']/gi),
        ...html.matchAll(/<link\b[^>]*\bhref=["'](https?:\/\/[^"']+)["']/gi),
        ...html.matchAll(/url\((["']?)(https?:\/\/[^)"']+)\1\)/gi),
      ].map((m) => new URL(m[m.length - 1]).origin);

      for (const origin of new Set(fetched)) {
        if (linkedNotLoaded.has(origin)) continue;
        expect(
          known.has(origin),
          `${name} fetches from ${origin}, which is not declared in thirdParty.mjs. ` +
            `Add it there (with a reason and its CSP directives) or remove the reference.`,
        ).toBe(true);
      }
    }
  });

  test("the pinned hashes still match the files being served", async ({ page }) => {
    /*
     * The one test here that needs the network, and the only way to catch a
     * pin going STALE. If a CDN republishes a file we pinned, the browser
     * starts refusing it: three.js stops loading and the clock page shows its
     * error banner; analytics silently stops counting. Neither failure is
     * loud, so this test is the thing that notices.
     *
     * Offline, it skips rather than fails - an unreachable CDN says nothing
     * about whether the pin is correct, and a suite that cannot run on a train
     * is a suite that gets run less.
     */
    for (const [key, service] of Object.entries(THIRD_PARTY)) {
      if (!service.integrity || !service.url) continue;

      const [algorithm, expected] = service.integrity.split("-");

      let body: Buffer;
      try {
        const response = await page.request.get(service.url, { timeout: 15_000 });
        if (!response.ok()) {
          test.skip(true, `${key}: ${service.url} returned ${response.status()}`);
          return;
        }
        body = await response.body();
      } catch {
        test.skip(true, `${key}: ${service.url} is unreachable — cannot verify the pin`);
        return;
      }

      const actual = createHash(algorithm).update(body).digest("base64");
      expect(
        actual,
        `${key} is pinned to a file that is no longer what ${service.url} serves.\n` +
          `The browser is now REFUSING to run it. Re-pin with:\n` +
          `  curl -s ${service.url} | openssl dgst -${algorithm} -binary | openssl base64 -A`,
      ).toBe(expected);
    }
  });
});

/* ══════════════════════════════════════════════════════════════════════════
 *  3. Markup-level hardening
 * ══════════════════════════════════════════════════════════════════════════ */

test.describe("markup", () => {
  test("every new-tab link drops its opener and its referrer", async ({ page }) => {
    /*
     * A target="_blank" link hands the destination a `window.opener` handle
     * pointing back at this page, which it can use to navigate the tab it came
     * from - a link to a real site can leave a convincing fake behind you.
     * Modern browsers imply noopener, but the site states it rather than
     * relying on the visitor's browser being new. noreferrer additionally
     * tells the destination nothing about where the click came from, which
     * suits a deliberately pseudonymous site.
     *
     * src/components/ui/ExternalLink.tsx exports the one rel string all three
     * link components share; this is what keeps a fourth from being written
     * without it.
     */
    for (const { path, name } of PAGES) {
      const html = await rawHtml(page, path);
      const blanks = [...html.matchAll(/<a\b[^>]*\btarget=["']_blank["'][^>]*>/gi)].map((m) => m[0]);

      for (const tag of blanks) {
        const rel = /\brel=["']([^"']*)["']/i.exec(tag)?.[1] ?? "";
        const tokens = rel.toLowerCase().split(/\s+/);
        expect(tokens, `${name}: target="_blank" without rel="noopener" — ${tag.slice(0, 110)}`).toContain("noopener");
        expect(tokens, `${name}: target="_blank" without rel="noreferrer" — ${tag.slice(0, 110)}`).toContain("noreferrer");
      }
    }
  });

  test("no page uses an inline event handler", async ({ page }) => {
    /*
     * onclick="…" and friends are the one thing a strict CSP cannot permit
     * without 'unsafe-hashes'. Keeping the pages free of them is what lets
     * script-src stay clean, so this guards that property rather than the
     * handlers themselves - the first one added would force the policy open.
     */
    for (const { path, name } of PAGES) {
      /*
       * Scan the MARKUP only. Script and style bodies are stripped first
       * because an `onclick="` inside JavaScript is a string or a comment -
       * the game pages both explain in a code comment why they no longer use
       * inline handlers, and matching that prose would make this test fail on
       * its own documentation.
       */
      const markup = (await rawHtml(page, path))
        .replace(/<!--[\s\S]*?-->/g, "")
        .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "<script></script>")
        .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "<style></style>");
      const handlers = [
        ...markup.matchAll(/\son(click|error|load|change|input|submit|mouse[a-z]+|key[a-z]+|touch[a-z]+|focus|blur)\s*=\s*["']/gi),
      ].map((m) => m[0].trim());

      expect(handlers, `${name} contains inline event handlers: ${handlers.join(", ")}`).toEqual([]);
    }
  });

  test("the AI opt-out and the crawler rules both ship", async ({ page }) => {
    // robots.txt is only advisory on a Pages *project* path (it is not at the
    // origin root, which is where crawlers look) - the meta tag is the half
    // that has effect on this host, so its loss would be the quiet one.
    const html = await rawHtml(page, "./");
    expect(html, "the noai meta tag is gone").toMatch(
      /<meta[^>]+name="robots"[^>]+content="[^"]*noai/i,
    );
    expect(html, "the referrer policy is gone").toMatch(
      /<meta[^>]+name="referrer"[^>]+content="strict-origin-when-cross-origin"/i,
    );
  });
});

/* ══════════════════════════════════════════════════════════════════════════
 *  4. What the build must never leak
 * ══════════════════════════════════════════════════════════════════════════ */

test.describe("the export leaks nothing", () => {
  test("no build-machine paths or environment values ship", async ({ page }) => {
    /*
     * Static exports inline more than people expect - error overlays, source
     * paths, and anything put on `process.env` at build time all have a way of
     * ending up in the HTML. None of it belongs on a public page.
     */
    for (const { path, name } of PAGES) {
      const html = await rawHtml(page, path);
      expect(html, `${name} contains an absolute build path`).not.toMatch(/\/(Users|home)\/[a-z]/i);
      expect(html, `${name} mentions node_modules`).not.toContain("node_modules");
    }
  });

  test("the site stays pseudonymous", async ({ page }) => {
    /*
     * data/resume.ts carries a PRIVACY NOTE: the public site deliberately
     * shows a first name and a GitHub link, and no email, phone, employer, or
     * street address. That is a decision the repo can enforce rather than only
     * document - the risk is not a deliberate change but an incidental one, a
     * contact detail arriving in a project description or a PDF link.
     */
    for (const { path, name } of PAGES) {
      const html = await rawHtml(page, path);

      // Any mailto: or tel: link, and any bare email address in the text.
      expect(html, `${name} contains a mailto: link`).not.toMatch(/href=["']mailto:/i);
      expect(html, `${name} contains a tel: link`).not.toMatch(/href=["']tel:/i);
      expect(
        html.replace(/<!--[\s\S]*?-->/g, ""),
        `${name} contains what looks like an email address`,
      ).not.toMatch(/[\w.+-]+@[\w-]+\.[a-z]{2,}/i);
    }
  });
});

/* ══════════════════════════════════════════════════════════════════════════
 *  5. The local static server (scripts/serve-out.mjs)
 * ══════════════════════════════════════════════════════════════════════════ */

test.describe("the static test server", () => {
  /*
   * This server never ships - it exists so the suite and the screenshot script
   * can look at ./out the way GitHub Pages serves it. It is tested anyway, for
   * two reasons.
   *
   * The first is that it already had a real bug: decodeURIComponent throws on
   * a malformed percent-escape, the request handler is async, so the throw
   * became an unhandled rejection and Node killed the process. One bad URL
   * took the server down mid-run, and the suite then failed with connection
   * errors that pointed nowhere near the cause. That is the failure these
   * tests exist to prevent recurring.
   *
   * The second is that it reads files off disk using a path taken from the
   * network, which is the shape of code that earns a traversal test whether or
   * not it is exposed. It binds to 127.0.0.1 and runs only on a developer's
   * machine, so none of this is a live vulnerability - the point is that the
   * containment logic keeps working if the file is ever rearranged.
   *
   * It is exercised through the server the "export" project is already running
   * (playwright.config.ts) rather than by importing serveOut here: the module
   * uses import.meta, which Playwright's CommonJS transform for spec files
   * cannot load.
   */

  /** The server root, e.g. http://localhost:3100 - without the base path. */
  function serverRoot(baseURL: string | undefined): string {
    expect(baseURL, "the export project must define a baseURL").toBeTruthy();
    return new URL(baseURL!).origin;
  }

  test("a malformed URL gets a clean rejection instead of killing the server", async ({
    request,
    baseURL,
  }) => {
    const root = serverRoot(baseURL);

    for (const path of ["%E0%A4%A", "%", "%zz"]) {
      const response = await request.get(`${root}/FelixFallingCoolSite/${path}`);
      expect(
        response.status(),
        `"${path}" should be answered, not crash the server`,
      ).toBe(400);
    }

    // The assertion that actually matters: it is still answering afterwards.
    expect(
      (await request.get(baseURL!)).status(),
      "the server died on a malformed URL",
    ).toBe(200);
  });

  test("no request can read a file from outside ./out", async ({ request, baseURL }) => {
    const root = serverRoot(baseURL);

    const escapes = [
      "..%2f..%2f..%2f..%2fetc%2fpasswd",
      "..%2f..%2fpackage.json",
      "..%2f.env",
      "..%252f..%252fetc%252fpasswd",
      // The prefix-check trap: "<repo>/outside" starts with "<repo>/out", so a
      // bare startsWith(OUT_DIR) containment check would accept this.
      "..%2foutside%2fsecret",
      "%2e%2e%2f%2e%2e%2fetc%2fpasswd",
    ];

    for (const path of escapes) {
      const response = await request.get(`${root}/FelixFallingCoolSite/${path}`);
      const body = await response.text();

      // A refused path falls through to the export's own 404 page, so the
      // check is not on the status - it is that no real file ever comes back.
      expect(body, `${path} leaked /etc/passwd`).not.toMatch(/root:[^:]*:0:0:/);
      expect(body, `${path} leaked package.json`).not.toContain('"devDependencies"');
      expect(body, `${path} leaked the lockfile`).not.toContain('"lockfileVersion"');
    }

    expect(
      (await request.get(baseURL!)).status(),
      "the server died partway through the traversal attempts",
    ).toBe(200);
  });

  test("ordinary requests still work", async ({ request, baseURL }) => {
    /*
     * The counterweight to the two tests above. A "hardening" change that
     * simply 404s everything would satisfy both of them and break the entire
     * suite in a way that looks like a site bug.
     */
    for (const [path, type] of [
      ["", "text/html"],
      ["manifest.json", "application/json"],
      ["clockmaker.html", "text/html"],
      ["robots.txt", "text/plain"],
    ] as const) {
      const response = await request.get(`${baseURL}${path}`);
      expect(response.status(), `${path || "/"} should be served`).toBe(200);
      expect(response.headers()["content-type"], `${path || "/"} content-type`).toContain(type);
    }
  });
});
