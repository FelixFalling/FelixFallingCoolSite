import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/ui/Nav";
import Waves from "@/components/scene/Waves";
import Shore from "@/components/scene/Shore";
import styles from "./not-found.module.css";

/**
 * The 404 page. Next.js turns this file into out/404.html at build time, and
 * GitHub Pages automatically serves 404.html for any URL that doesn't exist —
 * so wrong links wash up here instead of on a browser error page.
 *
 * It reuses the coastal scene components (waves, rocks, fog) so even being
 * lost stays on theme.
 */

export const metadata: Metadata = {
  title: "Lost at sea — Flying Felix",
};

export default function NotFound() {
  return (
    <>
      <Nav />
      <main className={styles.sea}>
        <div className={styles.scene} aria-hidden="true">
          <Shore />
          <div className={styles.waves}>
            <Waves />
          </div>
        </div>

        <div className={styles.message}>
          <div className={styles.code}>404</div>
          <h1 className={styles.title}>Lost at sea</h1>
          <p className={styles.text}>
            This page drifted out with the tide — or it never existed at all.
            The fog makes it hard to tell.
          </p>
          <Link className={styles.home} href="/">
            ← Back to shore
          </Link>
        </div>
      </main>
    </>
  );
}
