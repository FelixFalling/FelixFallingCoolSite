import { resume } from "@/data/resume";
import Reveal from "@/components/ui/Reveal";
import styles from "./Education.module.css";

export default function Education() {
  return (
    <Reveal id="education">
      <h2 className="section-title">Education</h2>
      <div className={styles.grid}>
        {resume.education.map((school, i) => (
          <article key={i} className="card">
            <div className={styles.head}>
              <h3 className={styles.degree}>{school.degree}</h3>
              <span className={styles.year}>{school.year}</span>
            </div>
            <div className={styles.detail}>{school.detail}</div>
            {school.note && <p className={styles.note}>{school.note}</p>}
          </article>
        ))}
      </div>
      {resume.honors && <p className={styles.honors}>{resume.honors}</p>}
    </Reveal>
  );
}
