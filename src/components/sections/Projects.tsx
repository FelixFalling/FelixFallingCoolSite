import { resume } from "@/data/resume";
import Section from "@/components/ui/Section";
import ProjectCards from "./ProjectCards";
import styles from "./Projects.module.css";

export default function Projects() {
  return (
    <Section id="projects" title="Projects">
      <ProjectCards projects={resume.projects} grid={styles.grid} />
    </Section>
  );
}
