import type { MetadataRoute } from "next";

/**
 * Emits /robots.txt (static, via output: "export" - see the note in
 * sitemap.ts). Allows everything and points crawlers at the sitemap. Nothing
 * here is private; the site is deliberately public and pseudonymous.
 */
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: "https://felixfalling.github.io/FelixFallingCoolSite/sitemap.xml",
  };
}
