import { resume } from "@/data/resume";
import Section from "@/components/ui/Section";
import ExternalLink from "@/components/ui/ExternalLink";
import styles from "./Activity.module.css";

/**
 * The GitHub contribution graph — the "green squares" calendar from a GitHub
 * profile, recolored to the site's teal.
 *
 * The image comes from ghchart.rshah.org, a small free service that renders
 * any user's public contribution graph as an SVG (GitHub itself doesn't offer
 * an embeddable version). The hex in the URL sets the color ramp. If the
 * service ever disappears, the alt text + profile link below still work —
 * or just delete this section's line in page.tsx.
 */

const GITHUB_USER = "FelixFalling";
const CHART_URL = `https://ghchart.rshah.org/3a6f6b/${GITHUB_USER}`;

export default function Activity() {
  return (
    <Section id="activity" title="GitHub Activity">
      {/* tabIndex + role: the chart box scrolls sideways on small screens, so
          keyboard users must be able to focus it and scroll with arrow keys. */}
      <div
        className={styles.chartScroll}
        tabIndex={0}
        role="region"
        aria-label="GitHub contribution chart (scrolls horizontally)"
      >
        <img
          className={styles.chart}
          src={CHART_URL}
          alt={`${resume.name}'s GitHub contribution graph over the last year`}
          loading="lazy"
        />
      </div>
      <p className={styles.caption}>
        A year of commits, green-squares style —{" "}
        <ExternalLink href={resume.links.github}>more experiments on GitHub →</ExternalLink>
      </p>
    </Section>
  );
}
