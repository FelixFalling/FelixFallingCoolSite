import { primaryProjectLink, type Project } from "@/data/resume";
import Card from "@/components/ui/Card";
import Tag from "@/components/ui/Tag";
import ExternalLink from "@/components/ui/ExternalLink";
import Slides from "@/components/ui/Slides";
import styles from "./Projects.module.css";

/**
 * The shared card renderer used by BOTH the Projects and Games sections —
 * one definition of what a project card looks like, two sections that use it.
 * `grid` is the CSS class that decides the column layout (Projects uses the
 * featured 3-column grid, Games a simple 2-column one).
 */
export default function ProjectCards({ projects, grid }: { projects: Project[]; grid: string }) {
  return (
    <div className={grid}>
      {projects.map((project, i) => (
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
  );
}
