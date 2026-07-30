"use client";

import { useSyncExternalStore } from "react";
import styles from "./ThemeToggle.module.css";

/**
 * The light/dark switch in the nav.
 *
 * The actual theme is applied super-early by the script in layout.tsx (before
 * the page paints). This button reflects that value and flips it on click -
 * updating the <html data-theme> attribute and saving the choice to
 * localStorage so it sticks and the no-flash script can pick it up next time.
 *
 * WHERE THE STATE LIVES: on <html data-theme>, not in React. That attribute is
 * the single source of truth - the pre-paint script writes it before React
 * exists, and the CSS keys off it. So rather than copying it into useState on
 * mount (which duplicates state, and leaves the button stale if anything else
 * changes the theme), this SUBSCRIBES to the attribute via
 * useSyncExternalStore. The button is then a pure reflection of the DOM: set
 * data-theme from anywhere and the icon follows.
 */

/** Reflects the attribute the pre-paint script and `toggle` below both write. */
function getTheme(): "light" | "dark" {
  return document.documentElement.getAttribute("data-theme") === "dark"
    ? "dark"
    : "light";
}

/**
 * Watches <html> for changes to data-theme. useSyncExternalStore calls this
 * with a callback to run whenever the value might have changed, and expects an
 * unsubscribe function back.
 */
function subscribe(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
}

/**
 * During server rendering and the first hydration pass there is no DOM to
 * read, so both sides agree on "light" and React re-renders with the real
 * value immediately after. Same visible behaviour as before, minus the
 * setState-in-an-effect.
 */
const getServerTheme = (): "light" | "dark" => "light";

export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getTheme, getServerTheme);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    // Writing the attribute is what actually changes the theme AND what tells
    // this component to re-render (via the observer above) - there is no
    // setState to keep in sync.
    document.documentElement.setAttribute("data-theme", next);
    // Keep the mobile browser-chrome color in sync with the theme (the meta tag
    // is first created by the no-flash script in layout.tsx). Mirrors --sand.
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", next === "dark" ? "#0c1418" : "#edf1f1");
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* storage blocked - the choice just won't persist */
    }
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
