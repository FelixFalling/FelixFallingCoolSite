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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // suppressHydrationWarning: browser extensions (Dark Reader, Grammarly, …)
    // add attributes to <html> before React hydrates. This silences the
    // resulting harmless mismatch warning for the <html> element.
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
