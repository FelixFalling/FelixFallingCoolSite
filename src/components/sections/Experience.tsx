import { resume } from "@/data/resume";
import Reveal from "@/components/ui/Reveal";
import styles from "./Experience.module.css";

export default function Experience() {
  return (
    <Reveal id="experience">
      <h2 className="section-title">Experience</h2>
      <div className={styles.list}>
        {resume.experience.map((job, i) => (
          <article key={i} className="card">
            <div className={styles.head}>
              <h3 className={styles.role}>
                {job.company} — {job.title}
              </h3>
              <span className={styles.period}>{job.period}</span>
            </div>
            <div className={styles.location}>{job.location}</div>
            <ul className={styles.bullets}>
              {job.bullets.map((bullet, j) => (
                <li key={j}>{bullet}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </Reveal>
  );
}
