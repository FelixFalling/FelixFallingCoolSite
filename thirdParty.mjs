/**
 * ─────────────────────────────────────────────────────────────────────────
 *  EVERY OUTSIDE SERVICE THIS SITE TOUCHES - the complete list, in one file.
 * ─────────────────────────────────────────────────────────────────────────
 *
 *  WHY THIS FILE EXISTS. A third party you load is a third party that can run
 *  code in your visitors' browsers, or watch who they are. Before this file
 *  those origins were scattered - one in layout.tsx, one in weather.ts, one in
 *  Activity.tsx, two more inside a hand-written game page - so "what does this
 *  site talk to?" had no answer short of grepping for `https://`.
 *
 *  Now there is one answer, and three things are DERIVED from it rather than
 *  repeated:
 *
 *    • the components, which build their URLs from these constants
 *    • scripts/csp.mjs, which turns this list into the Content-Security-Policy
 *      shipped in every page - so the browser refuses to contact anything not
 *      named here
 *    • tests/security.spec.ts, which scans the BUILT html for external URLs and
 *      fails if it finds one this file does not list
 *
 *  The last point is the one that makes this a control rather than a comment:
 *  adding a third party without adding it here breaks the build.
 *
 *  ─────────────────────────────────────────────────────────────────────────
 *  TO ADD A THIRD PARTY: add it below, say what it is for, and give it the
 *  narrowest CSP role that works (see `csp` in each entry). To REMOVE one:
 *  delete its entry and the code that used it - the tests will point at
 *  anything you missed.
 *
 *  This is a .mjs at the repo root, like basePath.mjs, for one reason: plain
 *  JavaScript can be imported by the TypeScript app AND by the plain-node
 *  build scripts. A .ts file could not be read by scripts/csp.mjs.
 */

/**
 * A .mjs file cannot carry TypeScript types, so the shape is documented here
 * and checked by tests/security.spec.ts instead.
 *
 * @typedef {object} ThirdParty
 * @property {string} origin   Scheme + host. This is what lands in the CSP.
 * @property {string} why      What it is for, in one line.
 * @property {string[]} csp    Which CSP directives this origin belongs in.
 * @property {string} [url]    The full URL, when components need it.
 * @property {string} [integrity]  SRI hash - REQUIRED for every script.
 * @property {string[]} [pages]    Which pages use it (default: all).
 */

/** @type {Record<string, ThirdParty>} */
export const THIRD_PARTY = {
  /*
   * NO ANALYTICS. There used to be a GoatCounter tag here. It was removed
   * because the account it reported to was never claimed - every hit came back
   * 400, so nothing was ever recorded - and an unclaimed code is one anybody
   * else can register, at which point this site's visitors would have been
   * reporting to a stranger.
   *
   * Removing it took the site to ZERO third-party JavaScript, which is worth
   * more than the visit counts were: the Content-Security-Policy generated from
   * this file no longer needs to allow any outside script origin on the main
   * site at all.
   *
   * TO BRING ANALYTICS BACK: claim the code at https://www.goatcounter.com
   * first, then re-add an entry here (script origin under "script-src", the
   * reporting endpoint under "connect-src" AND "img-src" - GoatCounter uses
   * sendBeacon with an image fallback) and the tag in src/app/layout.tsx. Pin
   * the script to a versioned URL with an integrity hash, as everything else
   * here is.
   */

  /*
   * Live conditions at Newport, Oregon - the wind speeds the waves up and the
   * rain layer switches on. No API key, no account, and the scene falls back
   * to its defaults if the request fails. See src/components/scene/weather.ts.
   */
  weatherApi: {
    origin: "https://api.open-meteo.com",
    url: "https://api.open-meteo.com/v1/forecast",
    why: "Open-Meteo current conditions, drives the hero scene's weather",
    csp: ["connect-src"],
    pages: ["next"],
  },

  /*
   * The GitHub contribution graph in the Activity section. An <img> only - it
   * is never allowed to be a script, which is the whole point of listing it
   * under img-src alone.
   */
  contributionChart: {
    origin: "https://ghchart.rshah.org",
    why: "Renders the GitHub contribution calendar as an SVG image",
    csp: ["img-src"],
    pages: ["next"],
  },

  /*
   * three.js for the Curse of Ra clock (public/clockmaker.html). Pinned to an
   * exact release with an integrity hash - that file is hand-written HTML and
   * cannot import from here, so the hash is written in the tag itself and
   * tests/security.spec.ts checks the two agree.
   */
  threeJs: {
    origin: "https://cdnjs.cloudflare.com",
    url: "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js",
    integrity:
      "sha512-dLxUelApnYxpLt6K2iomGngnHO83iUvZytA3YjDUCjT0HDOHKXnVYdf3hU4JjM8uEhxf9nD1/ey98U3t2vZ0qQ==",
    why: "3D library for the Curse of Ra clock page",
    csp: ["script-src"],
    pages: ["clockmaker"],
  },

  /*
   * Web fonts for the two game pages only. The main site ships no web fonts at
   * all - it uses the system stack - so these never touch it.
   *
   * googleapis serves the CSS; gstatic serves the font FILES the CSS points
   * at. Both are needed, in different directives.
   */
  googleFontsCss: {
    origin: "https://fonts.googleapis.com",
    why: "Google Fonts stylesheet for the game pages",
    csp: ["style-src"],
    pages: ["clockmaker", "ghost-cat"],
  },
  googleFontsFiles: {
    origin: "https://fonts.gstatic.com",
    why: "The actual font files the Google Fonts stylesheet references",
    csp: ["font-src"],
    pages: ["clockmaker", "ghost-cat"],
  },
};

/**
 * Origins allowed in `directive` on `page`.
 *
 * `page` is one of the keys used in `pages` above: "next" for anything Next
 * builds (the home page, the 404), or a game page's basename.
 *
 * @param {string} directive  e.g. "script-src"
 * @param {string} page       e.g. "next" | "clockmaker" | "ghost-cat"
 * @returns {string[]}
 */
export function originsFor(directive, page) {
  return Object.values(THIRD_PARTY)
    .filter((t) => t.csp.includes(directive) && (t.pages ?? []).includes(page))
    .map((t) => t.origin);
}

/** Every origin in the inventory, deduplicated - used by the tests. */
export function allOrigins() {
  return [...new Set(Object.values(THIRD_PARTY).map((t) => t.origin))].sort();
}
