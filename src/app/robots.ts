import type { MetadataRoute } from "next";

/**
 * Emits /robots.txt (static, via output: "export" - see the note in
 * sitemap.ts).
 *
 * Policy: ordinary search engines (Googlebot, Bingbot, DuckDuckBot, ...) are
 * allowed, so the site stays findable. The AI crawlers listed below - both
 * model-training scrapers and live-retrieval "answer" bots - are disallowed
 * everywhere.
 *
 * Caveat worth remembering: this is a GitHub Pages *project* site, so this file
 * lives at /FelixFallingCoolSite/robots.txt, NOT the origin root
 * (felixfalling.github.io/robots.txt) that crawlers actually read for rules.
 * Until the site moves to a custom domain, this is a stated intent more than an
 * enforced wall - the <meta name="robots" content="noai, noimageai"> in
 * layout.tsx is the part that has effect on the current host, because it rides
 * in the static HTML the bots fetch. The list is curated, not exhaustive: new
 * AI bots appear constantly, so add them here as you see them.
 */
export const dynamic = "force-static";

// Grouped by operator so it's easy to scan and extend.
const AI_CRAWLERS = [
  // OpenAI
  "GPTBot", "OAI-SearchBot", "ChatGPT-User",
  // Anthropic
  "ClaudeBot", "anthropic-ai", "Claude-Web", "Claude-User", "Claude-SearchBot",
  // Google / Apple AI-training opt-out tokens
  "Google-Extended", "Applebot-Extended",
  // Meta
  "meta-externalagent", "Meta-ExternalFetcher", "FacebookBot",
  // Perplexity
  "PerplexityBot", "Perplexity-User",
  // Common Crawl - feeds many training datasets
  "CCBot",
  // Others
  "Amazonbot", "Bytespider", "cohere-ai", "Diffbot", "Omgilibot", "Omgili",
  "YouBot", "ImagesiftBot", "AI2Bot", "Timpibot", "PanguBot", "DuckAssistBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: AI_CRAWLERS, disallow: "/" },
      { userAgent: "*", allow: "/" },
    ],
    sitemap: "https://felixfalling.github.io/FelixFallingCoolSite/sitemap.xml",
  };
}
