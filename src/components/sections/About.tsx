import { resume } from "@/data/resume";
import Section from "@/components/ui/Section";
import styles from "./About.module.css";

export default function About() {
  return (
    <Section id="about" title="About">
      <p className={styles.text}>{resume.about}</p>
    </Section>
  );
}
