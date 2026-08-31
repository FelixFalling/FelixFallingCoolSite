/**
 * Serves ./out - the real static export - the way GitHub Pages does.
 *
 * WHY THIS EXISTS. Everything else in this project runs against `next dev`:
 * the Playwright suite, and until now the screenshots too. The dev server is
 * not what ships. It doesn't minify, it serves modules instead of the built
 * chunks, and it happily runs code that `next build` would reject. That gap
 * has already cost this project once - a CSS minifier dropped a transform hint
 * from a keyframe and nothing caught it, because nothing ever looked at the
 * built output.
 *
 * So: one tiny server, no dependencies, mounting ./out under the same base
 * path Pages uses. Shared by scripts/screenshots.mjs (so the pictures on the
 * site are taken of the artifact that actually ships) and by the "export"
 * Playwright project.
 */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize, resolve, sep } from "node:path";
import { BASE_PATH } from "../basePath.mjs";

const OUT_DIR = resolve(import.meta.dirname, "..", "out");

const CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
  ".pdf": "application/pdf",
  ".woff2": "font/woff2",
};

/**
 * Resolve a request path to a file inside ./out, mirroring how Pages serves a
 * `trailingSlash: false` export: "/x" is tried as "/x.html" and "/x/index.html".
 * Returns null for anything that escapes the directory or doesn't exist.
 */
async function readCandidate(urlPath) {
  // Strip the base path; requests outside it are 404s, as on Pages.
  if (urlPath !== BASE_PATH && !urlPath.startsWith(`${BASE_PATH}/`)) return null;
  let relative = urlPath.slice(BASE_PATH.length) || "/";

  if (relative.endsWith("/")) relative += "index.html";

  /*
   * Two independent guards, because one of them is easy to get subtly wrong.
   *
   * normalize() collapses any ../ segments before they can climb out of ./out.
   * That alone is already enough here (every path reaching this point starts
   * with "/", and normalize drops leading ../ from an absolute path), but the
   * check below does not rely on that reasoning staying true.
   *
   * The containment check compares against OUT_DIR **plus a separator**, not
   * against OUT_DIR alone. A bare startsWith(OUT_DIR) is the classic version
   * of this bug: with OUT_DIR = "/repo/out" it also accepts "/repo/outside",
   * because that string does start with "/repo/out". Nothing can currently
   * reach that case, which is exactly why it would survive unnoticed if the
   * code above it were ever rearranged.
   */
  const base = join(OUT_DIR, normalize(relative));
  if (base !== OUT_DIR && !base.startsWith(OUT_DIR + sep)) return null;

  const candidates = extname(base) ? [base] : [`${base}.html`, join(base, "index.html"), base];
  for (const candidate of candidates) {
    try {
      return { body: await readFile(candidate), path: candidate };
    } catch {
      /* try the next shape */
    }
  }
  return null;
}

/**
 * Start the server on an ephemeral port.
 * Resolves to { url, close } - url includes the base path and trailing slash,
 * so it can be handed straight to page.goto() or Playwright's `baseURL`.
 */
export async function serveOut(port = 0) {
  const server = createServer(async (req, res) => {
    /*
     * WHY THIS IS WRAPPED. decodeURIComponent throws URIError on a malformed
     * percent-escape - "%E0%A4%A" is enough - and this handler is async, so
     * the throw became a rejected promise that node:http never sees. On Node
     * 15+ an unhandled rejection terminates the process, so a single bad URL
     * took the whole server down mid-run and the suite failed with a
     * connection error that pointed nowhere near the cause.
     *
     * The catch is deliberately around the ENTIRE handler rather than just the
     * decode: a static file server that can be killed by a request is the bug,
     * and fixing only the one call that happens to throw today leaves that
     * property in place.
     */
    let urlPath;
    try {
      urlPath = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    } catch {
      res.writeHead(400, { "content-type": "text/plain; charset=utf-8" });
      res.end("Bad request URI");
      return;
    }

    let found;
    try {
      found = await readCandidate(urlPath);
    } catch (error) {
      res.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
      res.end("Internal error");
      console.error(`serve-out: failed to serve ${urlPath}:`, error);
      return;
    }

    if (!found) {
      // The export writes a real 404.html; serve it so the not-found page can
      // be tested against the built output too.
      const notFound = await readCandidate(`${BASE_PATH}/404.html`);
      res.writeHead(404, { "content-type": "text/html; charset=utf-8" });
      res.end(notFound ? notFound.body : "Not found");
      return;
    }

    res.writeHead(200, {
      "content-type": CONTENT_TYPES[extname(found.path)] ?? "application/octet-stream",
      // No caching: a stale chunk would defeat the whole point of testing the
      // freshly built output.
      "cache-control": "no-store",
    });
    res.end(found.body);
  });

  await new Promise((done) => server.listen(port, "127.0.0.1", done));
  const { port: actual } = server.address();

  return {
    url: `http://localhost:${actual}${BASE_PATH}/`,
    close: () => new Promise((done) => server.close(done)),
  };
}
