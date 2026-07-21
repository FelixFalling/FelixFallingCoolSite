import { resume } from "@/data/resume";
import Section from "@/components/ui/Section";
import Card from "@/components/ui/Card";
import styles from "./Experience.module.css";

export default function Experience() {
  return (
    <Section id="experience" title="Experience">
      <div className={styles.list}>
        {resume.experience.map((job, i) => (
          <Card key={i}>
            <div className={styles.head}>
              <h3 className={styles.role}>
                {job.company} - {job.title}
              </h3>
              <span className={styles.period}>{job.period}</span>
            </div>
            <div className={styles.location}>{job.location}</div>
            <ul className={styles.bullets}>
              {job.bullets.map((bullet, j) => (
                <li key={j}>{bullet}</li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </Section>
  );
}
