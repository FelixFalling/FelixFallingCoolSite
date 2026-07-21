"use client";

import { useState } from "react";
import styles from "./ConstructionBanner.module.css";

/**
 * A small "still building this" notice across the top of the page. It's a
 * plain banner, not sticky, so it scrolls away with the rest of the content
 * and the nav bar takes over from there. Dismissing it just hides it for the
 * current visit (no localStorage) — refreshing the page brings it back.
 */
export default function ConstructionBanner() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className={styles.banner} role="status">
      <span className={styles.text}>
        This site is under construction — some things may be unfinished or change.
      </span>
      <button
        type="button"
        onClick={() => setVisible(false)}
        className={styles.close}
        aria-label="Dismiss this notice"
        title="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}
