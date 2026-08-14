import { resume } from "@/data/resume";
import Section from "@/components/ui/Section";
import styles from "./About.module.css";

export default function About() {
  return (
    <Section id="about" title="About">
      {/* A plank of the wreck with the text on it - see .salvage in
          globals.css. The timing is inline because this panel has no siblings
          to be de-synced against by the nth-child rules there, and every
          floating panel needs its own rhythm or the page hinges as one sheet. */}
      <div className="salvage adrift" style={{ animationDuration: "12.5s", animationDelay: "-2.3s" }}>
        <p className={styles.text}>{resume.about}</p>
      </div>
    </Section>
  );
}
