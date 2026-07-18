import { resume } from "@/data/resume";
import HeroScene from "@/components/scene/HeroScene";
import Button from "@/components/ui/Button";
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
            <Button href={links.github} external>
              GitHub
            </Button>
            {links.linkedin && (
              <Button href={links.linkedin} external>
                LinkedIn
              </Button>
            )}
            {links.resumePdf && (
              <Button href={`${BASE_PATH}/${links.resumePdf}`} variant="ghost" download>
                Download resume ↓
              </Button>
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

      <HeroScene />
    </header>
  );
}
