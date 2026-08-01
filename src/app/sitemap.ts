import type { MetadataRoute } from "next";

/**
 * Emits /sitemap.xml. Next generates it as a static file at build time and it
 * lands in ./out, so GitHub Pages serves it at
 * https://felixfalling.github.io/FelixFallingCoolSite/sitemap.xml.
 *
 * `force-static` is required: next.config.mjs uses output: "export", which
 * can't run anything at request time - the file is written once during the
 * build.
 *
 * The two game pages belong here as much as the home page does. They are
 * hand-written HTML in public/ rather than Next routes, so nothing adds them
 * automatically - they were missing from this file until it was noticed that
 * robots.txt invites crawlers in (everything except the AI scrapers is
 * allowed) and the Games section links straight to them. A page that is
 * linked, crawlable and absent from the sitemap is simply found later and
 * less reliably.
 *
 * They get a lower priority than the home page - they're the fun extras, not
 * the thing someone searching for me is looking for - and `yearly`, since a
 * finished game changes far less often than the resume content.
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
    {
      url: `${SITE_URL}clockmaker.html`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}ghost-cat.html`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.5,
    },
  ];
}
