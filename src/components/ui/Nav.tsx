import { resume } from "@/data/resume";
import ThemeToggle from "./ThemeToggle";
import NavLinks from "./NavLinks";
import styles from "./Nav.module.css";

/**
 * Sticky top navigation. The links themselves live in NavLinks.tsx, which
 * highlights whichever section you've scrolled to.
 */
export default function Nav() {
  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        <a href="#top" className={styles.brand}>
          {resume.name}
        </a>
        <div className={styles.right}>
          <NavLinks />
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
