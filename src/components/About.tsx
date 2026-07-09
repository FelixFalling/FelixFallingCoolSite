import { resume } from "@/data/resume";
import Reveal from "./Reveal";

export default function About() {
  return (
    <Reveal id="about">
      <h2 className="section-title">About</h2>
      <p style={{ margin: 0, fontSize: 17, maxWidth: 720, color: "var(--slate)" }}>
        {resume.about}
      </p>
    </Reveal>
  );
}
