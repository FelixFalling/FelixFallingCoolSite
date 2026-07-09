import { resume } from "@/data/resume";
import Reveal from "./Reveal";
import styles from "./Skills.module.css";

export default function Skills() {
  return (
    <Reveal id="skills">
      <h2 className="section-title">Skills</h2>
      <div className={styles.grid}>
        {resume.skills.map((group, i) => (
          <div key={i}>
            <div className={styles.heading}>{group.heading}</div>
            <div className={styles.skills}>{group.skills.join(" · ")}</div>
          </div>
        ))}
      </div>
    </Reveal>
  );
}
