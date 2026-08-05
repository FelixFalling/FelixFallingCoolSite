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
import { extname, join, normalize, resolve } from "node:path";
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

  // normalize() collapses any ../ before it can climb out of ./out.
  const base = join(OUT_DIR, normalize(relative));
  if (!base.startsWith(OUT_DIR)) return null;

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
    const urlPath = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    const found = await readCandidate(urlPath);

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
