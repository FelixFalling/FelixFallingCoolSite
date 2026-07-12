"use client";

import { useEffect, useState } from "react";
import styles from "./ThemeToggle.module.css";

/**
 * The light/dark switch in the nav.
 *
 * The actual theme is applied super-early by the script in layout.tsx (before
 * the page paints). This button just reads the current value on mount and flips
 * it on click — updating the <html data-theme> attribute and saving the choice
 * to localStorage so it sticks and the no-flash script can pick it up next time.
 */
export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // On mount, read whatever theme the no-flash script already put on <html>.
  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme");
    setTheme(current === "dark" ? "dark" : "light");
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* storage blocked — the choice just won't persist */
    }
    setTheme(next);
  }

  const label = theme === "dark" ? "Switch to light mode" : "Switch to dark mode";

  return (
    <button
      type="button"
      onClick={toggle}
      className={styles.toggle}
      aria-label={label}
      title={label}
    >
      <span aria-hidden="true">{theme === "dark" ? "☀️" : "🌙"}</span>
    </button>
  );
}
