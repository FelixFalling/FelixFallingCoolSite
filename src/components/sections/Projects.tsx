import { resume } from "@/data/resume";
import Reveal from "@/components/ui/Reveal";
import Slides from "@/components/ui/Slides";
import styles from "./Projects.module.css";

export default function Projects() {
  return (
    <Reveal id="projects">
      <h2 className="section-title">Projects</h2>
      <div className={styles.grid}>
        {resume.projects.map((project, i) => (
          <article key={i} className={`card ${styles.card}`}>
            {project.images && project.images.length > 0 && (
              <Slides images={project.images} title={project.title} />
            )}
            <div className={styles.eyebrow}>{project.eyebrow}</div>
            <h3 className={styles.title}>{project.title}</h3>
            <p className={styles.description}>{project.description}</p>
            {project.links && project.links.length > 0 && (
              <div className={styles.links}>
                {project.links.map((link) => (
                  <a
                    key={link.href}
                    className={styles.link}
                    href={link.href}
                    target="_blank"
                    rel="noopener"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            )}
            <div className={styles.tags}>
              {project.tags.map((tag, j) => (
                <span key={j} className="tag">
                  {tag}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </Reveal>
  );
}
