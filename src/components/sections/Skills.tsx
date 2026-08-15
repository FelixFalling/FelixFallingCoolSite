import { resume } from "@/data/resume";
import Section from "@/components/ui/Section";
import Waterline from "@/components/ui/Waterline";
import styles from "./Skills.module.css";

export default function Skills() {
  return (
    <Section id="skills" title="Skills">
      {/* Its own drift rhythm - see the note in About.tsx. */}
      <div className="salvage adrift" style={{ animationDuration: "10.5s", animationDelay: "-6.4s" }}>
        <div className={styles.grid}>
          {resume.skills.map((group, i) => (
            <div key={i}>
              <div className={styles.heading}>{group.heading}</div>
              <div className={styles.skills}>{group.skills.join(" · ")}</div>
            </div>
          ))}
        </div>
        <Waterline />
      </div>
    </Section>
  );
}
