import type { Metadata } from "next";
import { resume } from "@/data/resume";
import "./globals.css";

/**
 * The root layout wraps every page. In the App Router, this file provides the
 * <html> and <body> tags and is the place for site-wide <head> metadata.
 */

// The public URL the site is served from - used to build absolute URLs for
// the social-preview tags below (crawlers require absolute URLs).
const SITE_URL = "https://felixfalling.github.io/FelixFallingCoolSite/";

const TITLE = `${resume.name} - ${resume.jobTitle}`;
const DESCRIPTION =
  "Portfolio of Nick - software developer focused on test automation, " +
  "embedded systems, and DevOps. Featuring an animated Oregon-coast scene.";

/**
 * The `openGraph` and `twitter` blocks are what make a pasted link unfurl
 * into a rich card (image + title + description) on LinkedIn, Discord, Slack,
 * iMessage, etc. The card image is public/og.png - a screenshot of the hero.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: resume.name,
    type: "website",
    images: [{ url: "og.png", width: 1200, height: 630, alt: "Nick - an animated foggy coast with sea stacks and waves" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["og.png"],
  },
  // The AI opt-out that actually works on this host (see robots.ts for why the
  // robots.txt alone doesn't, on a Pages project path). It's server-rendered
  // into the static HTML, so scrapers that don't run JS still see it. Only the
  // non-standard noai/noimageai tokens are set, so ordinary search engines -
  // which ignore directives they don't recognize - keep indexing the site
  // normally; nothing here says noindex.
  other: { robots: "noai, noimageai" },
  manifest: "manifest.json",
  // apple-touch-icon must be a PNG - iOS ignores the SVG favicon in app/icon.svg.
  // These are rendered from that same SVG (see the icons in public/).
  icons: {
    apple: [{ url: "icon-180.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    title: resume.name,
    statusBarStyle: "default",
  },
};

/**
 * Runs before the page paints, so the correct theme is applied with no flash of
 * the wrong colors. It uses the saved choice if there is one, otherwise the
 * operating system's light/dark preference. The nav's toggle updates both the
 * <html data-theme> attribute and the saved value. The clock page reads the
 * same "theme" key, so your choice carries across the whole site.
 *
 * It also sets <meta name="theme-color"> so the mobile browser chrome (iOS
 * Safari's status bar, Android's address bar) matches the page background.
 * Done here rather than via Next's viewport export because that can only react
 * to the OS preference, not the saved/toggled override this script honors. The
 * nav's ThemeToggle keeps the meta in sync when you flip the theme.
 */
const themeInitScript = `
(function () {
  try {
    var t = localStorage.getItem('theme');
    if (t !== 'light' && t !== 'dark') {
      t = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    var q = new URLSearchParams(location.search).get('theme');
    if (q === 'light' || q === 'dark') t = q;
    document.documentElement.setAttribute('data-theme', t);
    // Marks that JavaScript is running, BEFORE the first paint. globals.css
    // uses html.js to pre-hide the scroll-reveal sections, so they start
    // invisible instead of being painted and then blanked by React after
    // hydration (which flashed on slow devices). Without JS the class never
    // lands and every section stays plainly visible.
    document.documentElement.classList.add('js');
    // Mirrors --sand (globals.css) for each theme.
    var c = t === 'dark' ? '#0c1418' : '#edf1f1';
    var m = document.querySelector('meta[name="theme-color"]');
    if (!m) { m = document.createElement('meta'); m.setAttribute('name', 'theme-color'); document.head.appendChild(m); }
    m.setAttribute('content', c);
  } catch (e) {}
})();
`;

/**
 * Privacy-friendly visit counts via GoatCounter - no cookies, no personal
 * data, GDPR-safe. The dashboard lives at https://felixfalling.goatcounter.com
 * (create the free account with that exact code to claim it). Until it IS
 * claimed the endpoint rejects every hit with a 400, which shows up in the
 * console on the deployed site - harmless, nothing is recorded, and the page
 * is unaffected, but it is not silent. To remove analytics entirely, delete
 * the <script> tag below.
 */
const GOATCOUNTER_URL = "https://felixfalling.goatcounter.com/count";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // suppressHydrationWarning: the theme script below (and browser extensions
    // like Dark Reader) set attributes on <html> before React hydrates. This
    // silences the resulting harmless mismatch warning for the <html> element.
    <html lang="en" suppressHydrationWarning>
      <body>
        {/*
          Warm up the two third-party origins the page pulls from, so the DNS
          lookup + TLS handshake happen while the HTML is still parsing instead
          of when the request is made. React hoists these into <head>.

          ghchart is the GitHub contribution graph in the Activity section (an
          image far down the page); gc.zgo.at is the GoatCounter script below.
        */}
        <link rel="preconnect" href="https://ghchart.rshah.org" />
        <link rel="preconnect" href="https://gc.zgo.at" />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        {children}
        <script data-goatcounter={GOATCOUNTER_URL} async src="https://gc.zgo.at/count.js" />
      </body>
    </html>
  );
}
