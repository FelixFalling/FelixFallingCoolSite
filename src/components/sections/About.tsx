import { resume } from "@/data/resume";
import Reveal from "@/components/ui/Reveal";
import styles from "./About.module.css";

export default function About() {
  return (
    <Reveal id="about">
      <h2 className="section-title">About</h2>
      <p className={styles.text}>{resume.about}</p>
    </Reveal>
  );
}
