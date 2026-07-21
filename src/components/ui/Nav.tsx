import { resume } from "@/data/resume";
import ThemeToggle from "./ThemeToggle";
import styles from "./Nav.module.css";

/**
 * Sticky top navigation. Links jump to each section by its `id`.
 * Experience/Education links are omitted while those sections are hidden -
 * see the PRIVACY note in app/page.tsx.
 */
const links = [
  { href: "#about", label: "About" },
  { href: "#projects", label: "Projects" },
  { href: "#games", label: "Games" },
  { href: "#skills", label: "Skills" },
  { href: "#activity", label: "Activity" },
  { href: "#contact", label: "Contact" },
];

export default function Nav() {
  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        <a href="#top" className={styles.brand}>
          {resume.name}
        </a>
        <div className={styles.right}>
          <div className={styles.links}>
            {links.map((link) => (
              <a key={link.href} href={link.href} className={styles.link}>
                {link.label}
              </a>
            ))}
          </div>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
