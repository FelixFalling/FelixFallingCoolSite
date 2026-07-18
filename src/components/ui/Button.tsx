import Link from "next/link";
import styles from "./Button.module.css";

/**
 * The site's shared button — a link styled as a button, used by the hero
 * (GitHub / LinkedIn / resume) and the 404 page ("Back to shore").
 *
 * Variants:
 *   • "primary" — solid, for the main action
 *   • "ghost"   — outlined, for secondary actions
 *
 * `external` opens in a new tab (and adds the rel security attributes);
 * internal links go through Next's <Link> so the GitHub Pages base path is
 * handled automatically. `download` marks a file download (the resume PDF).
 */
export default function Button({
  href,
  variant = "primary",
  external = false,
  download = false,
  children,
}: {
  href: string;
  variant?: "primary" | "ghost";
  external?: boolean;
  download?: boolean;
  children: React.ReactNode;
}) {
  const className = variant === "ghost" ? styles.ghost : styles.primary;

  if (external) {
    return (
      <a className={className} href={href} target="_blank" rel="noopener">
        {children}
      </a>
    );
  }
  if (download) {
    return (
      <a className={className} href={href} download>
        {children}
      </a>
    );
  }
  return (
    <Link className={className} href={href}>
      {children}
    </Link>
  );
}
