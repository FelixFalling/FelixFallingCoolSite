import { resume } from "@/data/resume";
import styles from "./Contact.module.css";

/** Footer wave: a single sand-colored crest where the navy footer meets the page. */
function FooterWave() {
  return (
    <div className={styles.wave} aria-hidden="true">
      <svg viewBox="0 0 1200 70" preserveAspectRatio="none" className={styles.waveSvg}>
        <path
          d="M0 0 L1200 0 L1200 10 C 1050 45, 900 0, 750 22 C 600 44, 450 8, 300 28 C 150 48, 60 20, 0 32 Z"
          fill="var(--sand)"
        />
      </svg>
    </div>
  );
}

export default function Contact() {
  const year = new Date().getFullYear();

  return (
    <footer id="contact" className={styles.footer}>
      <FooterWave />
      <div className={styles.inner}>
        <h2 className={styles.title}>Get in touch</h2>
        <p className={styles.subtitle}>Open to software engineering opportunities.</p>
        <div className={styles.links}>
          <a className={styles.link} href={resume.links.github} target="_blank" rel="noopener">
            {prettyUrl(resume.links.github)}
          </a>
          {resume.links.linkedin && (
            <a className={styles.link} href={resume.links.linkedin} target="_blank" rel="noopener">
              {prettyUrl(resume.links.linkedin)}
            </a>
          )}
        </div>
        <div className={styles.copyright}>
          © {year} {resume.name}
        </div>
      </div>
    </footer>
  );
}

/** Turn "https://github.com/user" into "github.com/user" for display. */
function prettyUrl(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
}
