import { resume } from "@/data/resume";
import Section from "@/components/ui/Section";
import styles from "./Skills.module.css";

export default function Skills() {
  return (
    <Section id="skills" title="Skills">
      <div className={styles.grid}>
        {resume.skills.map((group, i) => (
          <div key={i}>
            <div className={styles.heading}>{group.heading}</div>
            <div className={styles.skills}>{group.skills.join(" · ")}</div>
          </div>
        ))}
      </div>
    </Section>
  );
}
