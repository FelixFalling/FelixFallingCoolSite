import { resume } from "@/data/resume";
import Waves from "./Waves";
import styles from "./Hero.module.css";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export default function Hero() {
  const { links } = resume;

  return (
    <header id="top" className={styles.hero}>
      <div className={styles.inner}>
        <div className={styles.text}>
          <div className={styles.eyebrow}>{resume.location}</div>
          <h1 className={styles.name}>{resume.name}</h1>
          <p className={styles.title}>{resume.jobTitle}</p>
          <p className={styles.specialties}>{resume.specialties}</p>

          <div className={styles.actions}>
            <a className={styles.btnPrimary} href={links.github} target="_blank" rel="noopener">
              GitHub
            </a>
            <a className={styles.btnPrimary} href={links.linkedin} target="_blank" rel="noopener">
              LinkedIn
            </a>
            {links.resumePdf && (
              <a className={styles.btnGhost} href={`${BASE_PATH}/${links.resumePdf}`} download>
                Download resume ↓
              </a>
            )}
          </div>
        </div>

        {resume.showPhoto && (
          <div className={styles.photoWrap}>
            <div className={styles.photo}>
              Photo
              <br />
              placeholder
            </div>
          </div>
        )}
      </div>

      <div className={styles.waves}>
        <Waves />
      </div>
    </header>
  );
}
