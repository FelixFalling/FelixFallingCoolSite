"use client";

import { useEffect, useState } from "react";
import styles from "./ConstructionPopup.module.css";

// Bump this if the notice ever needs to be shown again to people who already
// dismissed the old one (e.g. "construction-notice-dismissed-v2").
const STORAGE_KEY = "construction-notice-dismissed";

/**
 * A one-time "still building this" popup. It checks localStorage on mount -
 * if this visitor hasn't dismissed it before, it shows the dialog; closing it
 * (via the button, the backdrop, or Escape) saves that choice so it won't
 * show again on this device.
 *
 * Starts hidden on both server and first client render (avoids a hydration
 * mismatch), then the effect below decides whether to reveal it.
 */
export default function ConstructionPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) !== "1") {
        setOpen(true);
      }
    } catch {
      // storage blocked - just show it every visit rather than crash
      setOpen(true);
    }
  }, []);

  function dismiss() {
    setOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* storage blocked - the choice just won't persist */
    }
  }

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") dismiss();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  if (!open) return null;

  return (
    <div className={styles.backdrop} onClick={dismiss}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="construction-popup-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={dismiss}
          className={styles.close}
          aria-label="Dismiss this notice"
          title="Dismiss"
        >
          ✕
        </button>
        <h2 id="construction-popup-title" className={styles.title}>
          Under construction
        </h2>
        <p className={styles.text}>
          This site is still being built - some things may be unfinished or change.
        </p>
        <button type="button" onClick={dismiss} className={styles.action}>
          Got it
        </button>
      </div>
    </div>
  );
}
