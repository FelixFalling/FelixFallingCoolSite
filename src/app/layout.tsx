import type { Metadata } from "next";
import { resume } from "@/data/resume";
import "./globals.css";

/**
 * The root layout wraps every page. In the App Router, this file provides the
 * <html> and <body> tags and is the place for site-wide <head> metadata.
 */

// The public URL the site is served from — used to build absolute URLs for
// the social-preview tags below (crawlers require absolute URLs).
const SITE_URL = "https://felixfalling.github.io/FelixFallingCoolSite/";

const TITLE = `${resume.name} — ${resume.jobTitle}`;
const DESCRIPTION =
  "Portfolio of Flying Felix — software developer focused on test automation, " +
  "embedded systems, and DevOps. Featuring an animated Oregon-coast scene.";

/**
 * The `openGraph` and `twitter` blocks are what make a pasted link unfurl
 * into a rich card (image + title + description) on LinkedIn, Discord, Slack,
 * iMessage, etc. The card image is public/og.png — a screenshot of the hero.
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
    images: [{ url: "og.png", width: 1200, height: 630, alt: "Flying Felix — an animated foggy coast with sea stacks and waves" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["og.png"],
  },
};

/**
 * Runs before the page paints, so the correct theme is applied with no flash of
 * the wrong colors. It uses the saved choice if there is one, otherwise the
 * operating system's light/dark preference. The nav's toggle updates both the
 * <html data-theme> attribute and the saved value. The clock page reads the
 * same "theme" key, so your choice carries across the whole site.
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
  } catch (e) {}
})();
`;

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
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        {children}
      </body>
    </html>
  );
}
