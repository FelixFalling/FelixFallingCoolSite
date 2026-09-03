/**
 * ─────────────────────────────────────────────────────────────────────────
 *  Writes a Content-Security-Policy into every page of the static export.
 * ─────────────────────────────────────────────────────────────────────────
 *
 *  Runs as the second half of `npm run build`, after `next build` has written
 *  ./out. For each .html file it:
 *
 *    1. finds every INLINE <script> and hashes its exact contents
 *    2. builds a policy naming those hashes plus the origins in thirdParty.mjs
 *    3. injects it as the first thing inside <head>
 *
 *  ── WHY A BUILD STEP AND NOT A HAND-WRITTEN TAG ──────────────────────────
 *
 *  A strict CSP has to name a hash for each inline script it permits. Written
 *  by hand, that hash goes stale the first time anyone edits the theme script
 *  in layout.tsx - and the failure is silent in dev (no CSP there) and total in
 *  production (the theme script is blocked, the page flashes the wrong colours,
 *  and nothing in the build complains). Computing the hashes from the shipped
 *  bytes is the only version of this that stays true on its own.
 *
 *  Next also emits its own inline scripts - the hydration payload is a series
 *  of self.__next_f.push(...) blocks whose contents change with the content of
 *  the page. Those cannot be hand-hashed even in principle.
 *
 *  ── WHY A <meta> TAG AND NOT A HEADER ────────────────────────────────────
 *
 *  GitHub Pages serves static files and offers no way to set response headers,
 *  so <meta http-equiv> is the only delivery mechanism available. It is a real
 *  CSP with one documented gap: THREE DIRECTIVES ARE IGNORED IN META, and
 *  frame-ancestors is one of them. So this policy cannot stop the site being
 *  framed by another origin (clickjacking). Nothing here takes a click that
 *  would matter if it were hijacked - there are no forms, no auth, no state
 *  changes - but the gap is real, and closing it needs a host that can send
 *  headers. (The other two ignored directives, report-uri and sandbox, this
 *  policy does not use.)
 *
 *  ── HOW TO CHANGE THE POLICY ─────────────────────────────────────────────
 *
 *    • to allow a new third party  → add it to thirdParty.mjs, not here
 *    • to change a directive       → POLICY below, which is the whole policy
 *    • to check nothing broke      → npm test (tests/security.spec.ts loads
 *                                    every page and fails on ANY violation)
 */
import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve, basename, extname } from "node:path";
import { originsFor } from "../thirdParty.mjs";

const OUT_DIR = resolve(import.meta.dirname, "..", "out");

/** The marker that makes re-running this script safe (see `injectInto`). */
const META_RE =
  /[ \t]*<meta http-equiv="Content-Security-Policy" content="[^"]*">\n?/i;

/**
 * ─────────────────────────────────────────────────────────────────────────
 *  THE POLICY. Everything the browser is allowed to do, per page family.
 * ─────────────────────────────────────────────────────────────────────────
 *
 *  Each value is a list of CSP source expressions. Origins from thirdParty.mjs
 *  are appended automatically, and script-src additionally receives a hash for
 *  every inline script found in the page - neither is written here.
 *
 *  'self' means "this site's own origin". 'none' means nothing at all.
 */
const POLICY = {
  /*
   * The fallback for any fetch type not named below - media, workers,
   * prefetch, and anything a future browser adds. 'self' rather than 'none'
   * on purpose: 'none' would mean every new directive fails closed, which
   * sounds stricter but in practice breaks pages on browser updates for no
   * gain here, since same-origin is the honest default for this site.
   */
  "default-src": ["'self'"],

  /*
   * Scripts. NO 'unsafe-inline' and NO 'unsafe-eval' - the two tokens that
   * hollow out a CSP. Inline scripts run only because their exact hash is
   * listed, which is computed per build from the bytes that shipped.
   *
   * Note that naming even one hash makes browsers IGNORE 'unsafe-inline'
   * entirely, so the hashes are not merely an addition to the policy - they
   * are what closes it.
   */
  "script-src": ["'self'"],

  /*
   * Styles, and the one deliberate loosening in this policy.
   *
   * 'unsafe-inline' is here because the scene is built out of React
   * style={{…}} props - every wave layer, star, and duck positions itself with
   * one - and each of those becomes a literal style="" attribute in the
   * HTML that CSP governs. Hashing them is not workable: there are hundreds,
   * they change with any tuning value, and a browser matching them would still
   * be one refactor away from a blank page.
   *
   * This is a much smaller concession than it would be for scripts. CSS
   * injection cannot execute code; its worst realistic outcome is defacement
   * or, with an attacker-controlled selector, reading attribute values one
   * character at a time through image requests - and img-src below already
   * pins where images may be fetched from, which closes that channel.
   */
  "style-src": ["'self'", "'unsafe-inline'"],

  /* data: is for the tiny inline SVG/GIF placeholders; no other scheme. */
  "img-src": ["'self'", "data:"],

  "font-src": ["'self'"],

  /* fetch/XHR/sendBeacon/WebSocket destinations. */
  "connect-src": ["'self'"],

  /* The web app manifest. Same origin, always. */
  "manifest-src": ["'self'"],

  /*
   * Hard nos. Each of these is a capability the site does not use, so denying
   * it costs nothing and removes a class of attack outright:
   *
   *   object-src  - <object>/<embed>/<applet>: legacy plugin content, a
   *                 historically rich source of sandbox escapes
   *   base-uri    - stops injected markup rewriting <base href>, which would
   *                 silently repoint every relative URL on the page
   *   form-action - there are no forms; this means injected markup cannot
   *                 create one that posts somewhere
   *   frame-src   - the site embeds nothing
   *   worker-src  - no web or service workers
   */
  "object-src": ["'none'"],
  "base-uri": ["'self'"],
  "form-action": ["'none'"],
  "frame-src": ["'none'"],
  "worker-src": ["'none'"],

  /*
   * Rewrite any accidental http:// subresource to https:// rather than letting
   * it load in the clear. Belt and braces - there are none today.
   */
  "upgrade-insecure-requests": [],
};

/** Directives that take origins from thirdParty.mjs. */
const ORIGIN_DIRECTIVES = ["script-src", "style-src", "img-src", "font-src", "connect-src"];

/**
 * Which page family an output file belongs to, which is what decides its
 * allowlist. The game pages are hand-written HTML copied from public/ and
 * talk to different services than the Next-built pages do, so they get their
 * own entry in thirdParty.mjs rather than a shared, union-of-everything
 * policy - the clock may load three.js, the home page may not.
 */
function pageKindOf(file) {
  const name = basename(file, extname(file));
  return name === "clockmaker" || name === "ghost-cat" ? name : "next";
}

/**
 * The base64 SHA-256 of a script's contents, in the form CSP expects.
 *
 * The bytes must match EXACTLY what the browser parses between the tags -
 * every space and newline included - which is why this hashes the captured
 * text verbatim and never trims it.
 */
function hashScript(text) {
  return `'sha256-${createHash("sha256").update(text, "utf8").digest("base64")}'`;
}

/**
 * Every inline <script> body in an HTML document.
 *
 * Scripts with a `src` are skipped: those are governed by their origin (and,
 * for the third-party ones, by their integrity hash), not by a content hash.
 * The [^>]* is safe against the `>` inside a script BODY because it only ever
 * scans the opening tag.
 */
function inlineScripts(html) {
  const bodies = [];
  const re = /<script(?![^>]*\ssrc=)([^>]*)>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = re.exec(html)) !== null) {
    // A <script type="application/json"> (or any other non-executable type) is
    // data, not code - the browser never runs it, so CSP never checks it and
    // hashing it would just pad the policy.
    const type = /\stype=["']?([^"'\s>]+)/i.exec(match[1])?.[1]?.toLowerCase();
    const executable =
      !type || type === "module" || type === "text/javascript" || type === "application/javascript";
    if (executable && match[2].length > 0) bodies.push(match[2]);
  }
  return bodies;
}

/** Assemble the policy string for one page. */
function buildPolicy(html, kind) {
  const hashes = [...new Set(inlineScripts(html).map(hashScript))];

  return Object.entries(POLICY)
    .map(([directive, base]) => {
      const sources = [...base];
      if (ORIGIN_DIRECTIVES.includes(directive)) sources.push(...originsFor(directive, kind));
      if (directive === "script-src") sources.push(...hashes);
      // A valueless directive (upgrade-insecure-requests) is just its name.
      return sources.length > 0 ? `${directive} ${sources.join(" ")}` : directive;
    })
    .join("; ");
}

/**
 * Put the tag first inside <head>.
 *
 * POSITION IS LOAD-BEARING: a meta CSP governs only what the parser sees after
 * it, so anything above it in the head is exempt. First child of <head> is the
 * only placement with no gap.
 *
 * Any tag from a previous run is stripped first, so building twice without a
 * clean ./out cannot stack two policies (two CSPs both apply, and the browser
 * enforces the INTERSECTION - which is a very confusing way to break a page).
 */
function injectInto(html, policy) {
  const stripped = html.replace(META_RE, "");
  const tag = `<meta http-equiv="Content-Security-Policy" content="${policy}">`;
  const head = /<head(\s[^>]*)?>/i.exec(stripped);
  if (!head) return null;
  const at = head.index + head[0].length;
  return `${stripped.slice(0, at)}${tag}${stripped.slice(at)}`;
}

/** Every .html file under ./out, recursively. */
async function htmlFiles(dir) {
  const found = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...(await htmlFiles(path)));
    else if (entry.name.endsWith(".html")) found.push(path);
  }
  return found;
}

async function main() {
  let files;
  try {
    files = await htmlFiles(OUT_DIR);
  } catch {
    console.error(`csp: no ./out directory - run \`next build\` first.`);
    process.exit(1);
  }

  if (files.length === 0) {
    console.error("csp: ./out contains no .html files - did the build succeed?");
    process.exit(1);
  }

  for (const file of files) {
    const html = await readFile(file, "utf8");
    const kind = pageKindOf(file);
    const updated = injectInto(html, buildPolicy(html, kind));

    // A page with no <head> cannot carry a policy, and shipping it unprotected
    // silently is exactly the sort of gap this script exists to prevent.
    if (updated === null) {
      console.error(`csp: ${file} has no <head> - cannot add a policy.`);
      process.exit(1);
    }

    await writeFile(file, updated);
    console.log(`csp: ${file.slice(OUT_DIR.length + 1)} (${kind})`);
  }

  console.log(`csp: policy written into ${files.length} page(s).`);
}

await main();
