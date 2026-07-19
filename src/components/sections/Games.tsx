import { resume } from "@/data/resume";
import Section from "@/components/ui/Section";
import ProjectCards from "./ProjectCards";
import styles from "./Projects.module.css";

/** The just-for-fun corner: the vibe-coded games, in their own section. */
export default function Games() {
  return (
    <Section id="games" title="Games">
      <ProjectCards projects={resume.games} grid={styles.gamesGrid} />
    </Section>
  );
}
