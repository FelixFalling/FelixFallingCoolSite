import { resume } from "@/data/resume";
import styles from "./Nav.module.css";

/** Sticky top navigation. Links jump to each section by its `id`. */
const links = [
  { href: "#about", label: "About" },
  { href: "#experience", label: "Experience" },
  { href: "#projects", label: "Projects" },
  { href: "#education", label: "Education" },
  { href: "#skills", label: "Skills" },
  { href: "#contact", label: "Contact" },
];

export default function Nav() {
  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        <a href="#top" className={styles.brand}>
          {resume.name}
        </a>
        <div className={styles.links}>
          {links.map((link) => (
            <a key={link.href} href={link.href} className={styles.link}>
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}
