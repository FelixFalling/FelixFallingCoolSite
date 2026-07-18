import { resume } from "@/data/resume";
import Section from "@/components/ui/Section";
import Card from "@/components/ui/Card";
import styles from "./Education.module.css";

export default function Education() {
  return (
    <Section id="education" title="Education">
      <div className={styles.grid}>
        {resume.education.map((school, i) => (
          <Card key={i}>
            <div className={styles.head}>
              <h3 className={styles.degree}>{school.degree}</h3>
              <span className={styles.year}>{school.year}</span>
            </div>
            <div className={styles.detail}>{school.detail}</div>
            {school.note && <p className={styles.note}>{school.note}</p>}
          </Card>
        ))}
      </div>
      {resume.honors && <p className={styles.honors}>{resume.honors}</p>}
    </Section>
  );
}
