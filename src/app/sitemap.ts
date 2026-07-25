import type { MetadataRoute } from "next";

/**
 * Emits /sitemap.xml. Next generates it as a static file at build time and it
 * lands in ./out, so GitHub Pages serves it at
 * https://felixfalling.github.io/FelixFallingCoolSite/sitemap.xml.
 *
 * `force-static` is required: next.config.mjs uses output: "export", which
 * can't run anything at request time - the file is written once during the
 * build. This is a single-page site, so there is exactly one URL.
 */
export const dynamic = "force-static";

const SITE_URL = "https://felixfalling.github.io/FelixFallingCoolSite/";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
