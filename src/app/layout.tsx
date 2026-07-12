import type { Metadata } from "next";
import { resume } from "@/data/resume";
import "./globals.css";

/**
 * The root layout wraps every page. In the App Router, this file provides the
 * <html> and <body> tags and is the place for site-wide <head> metadata.
 */

export const metadata: Metadata = {
  title: `${resume.name} — ${resume.jobTitle}`,
  description: resume.about,
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
