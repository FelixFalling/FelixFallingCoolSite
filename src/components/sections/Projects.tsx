import { resume, primaryProjectLink } from "@/data/resume";
import Section from "@/components/ui/Section";
import Card from "@/components/ui/Card";
import Tag from "@/components/ui/Tag";
import ExternalLink from "@/components/ui/ExternalLink";
import Slides from "@/components/ui/Slides";
import styles from "./Projects.module.css";

export default function Projects() {
  return (
    <Section id="projects" title="Projects">
      <div className={styles.grid}>
        {resume.projects.map((project, i) => (
          <Card key={i} className={styles.card}>
            {project.images && project.images.length > 0 && (
              // Clicking a screenshot opens the project (its code when it has
              // a repo link — see primaryProjectLink in resume.ts).
              <Slides
                images={project.images}
                title={project.title}
                href={primaryProjectLink(project)?.href}
              />
            )}
            <div className={styles.eyebrow}>{project.eyebrow}</div>
            <h3 className={styles.title}>{project.title}</h3>
            <p className={styles.description}>{project.description}</p>
            {project.links && project.links.length > 0 && (
              <div className={styles.links}>
                {project.links.map((link) => (
                  <ExternalLink key={link.href} className={styles.link} href={link.href}>
                    {link.label}
                  </ExternalLink>
                ))}
              </div>
            )}
            <div className={styles.tags}>
              {project.tags.map((tag, j) => (
                <Tag key={j}>{tag}</Tag>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </Section>
  );
}
