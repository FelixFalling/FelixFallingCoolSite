/**
 * Next.js configuration.
 *
 * This site is deployed to GitHub Pages as a *project page* at:
 *   https://felixfalling.github.io/FelixFallingCoolSite/
 *
 * Two things make that work:
 *   1. output: 'export'  -> builds plain static HTML/CSS/JS into ./out
 *      (no Node server needed - GitHub Pages just serves the files).
 *   2. basePath          -> because the site lives under /FelixFallingCoolSite,
 *      every link and asset URL needs that prefix. Next handles this for you
 *      as long as you use <Link> and next/image, and we expose it as
 *      NEXT_PUBLIC_BASE_PATH for the few plain <a href> links to static files.
 *
 * If you ever rename the repo, change BASE_PATH in basePath.mjs.
 */

import { BASE_PATH } from "./basePath.mjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  basePath: BASE_PATH,
  // GitHub Pages can't run Next's image optimizer, so serve images as-is.
  images: { unoptimized: true },
  // Emit /about/index.html instead of /about.html - friendlier URLs on Pages.
  trailingSlash: true,
  env: {
    NEXT_PUBLIC_BASE_PATH: BASE_PATH,
  },
};

export default nextConfig;
