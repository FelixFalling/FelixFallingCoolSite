/** Reflects the attribute the pre-paint script and `toggle` below both write. */
export function getTheme(): "light" | "dark" {
  return document.documentElement.getAttribute("data-theme") === "dark"
    ? "dark"
    : "light";
}

/**
 * Watches <html> for changes to data-theme. useSyncExternalStore calls this
 * with a callback to run whenever the value might have changed, and expects an
 * unsubscribe function back.
 */
export function subscribeTheme(onChange: () => void): () => void {
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
export const getServerTheme = (): "light" | "dark" => "light";

