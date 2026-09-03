import { resume } from "@/data/resume";
import { THIRD_PARTY } from "../../../thirdParty.mjs";
import Section from "@/components/ui/Section";
import ExternalLink from "@/components/ui/ExternalLink";
import ActivityChart from "./ActivityChart";
import styles from "./Activity.module.css";

/**
 * The GitHub contribution graph - the "green squares" calendar from a GitHub
 * profile, recolored to the site's teal.
 *
 * The image comes from ghchart.rshah.org, a small free service that renders
 * any user's public contribution graph as an SVG (GitHub itself doesn't offer
 * an embeddable version). The hex in the URL sets the color ramp. If the
 * service ever disappears, the alt text + profile link below still work -
 * or just delete this section's line in page.tsx.
 */

const GITHUB_USER = "FelixFalling";
// The origin comes from thirdParty.mjs so this image can never point somewhere
// the Content-Security-Policy (generated from that same file) would block.
// The hex in the path is the colour ramp.
const CHART_URL = `${THIRD_PARTY.contributionChart.origin}/3a6f6b/${GITHUB_USER}`;

export default function Activity() {
  return (
    <Section id="activity" title="GitHub Activity">
      <ActivityChart
        src={CHART_URL}
        alt={`${resume.name}'s GitHub contribution graph over the last year`}
        label="GitHub contribution chart (scrolls horizontally)"
      />
      <p className={styles.caption}>
        A year of commits, green-squares style -{" "}
        <ExternalLink href={resume.links.github}>more experiments on GitHub →</ExternalLink>
      </p>
    </Section>
  );
}
