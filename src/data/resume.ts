/**
 * ─────────────────────────────────────────────────────────────────────────
 *  YOUR RESUME CONTENT — edit everything here.
 * ─────────────────────────────────────────────────────────────────────────
 *  This is the ONE file you change to update the site's text. The components
 *  just render whatever you put here, so you never have to touch layout/HTML
 *  to change your name, jobs, projects, etc.
 *
 *  TypeScript tip: the `: SomeType` annotations below describe the shape of
 *  each piece of data. If you mistype a field (e.g. forget a project's title),
 *  your editor will underline it in red before you ever deploy. That's the
 *  whole point of TypeScript — catching mistakes early.
 */

export interface Job {
  company: string;
  title: string;
  location: string;
  period: string; // e.g. "Jan 2024 – Present"
  bullets: string[];
}

export interface Project {
  eyebrow: string; // small label above the title, e.g. "2024 · Personal"
  title: string;
  description: string;
  link?: { label: string; href: string }; // optional "View repo →" style link
  tags: string[];
}

export interface School {
  degree: string;
  year: string;
  detail: string; // e.g. "University Name · GPA 3.9"
  note?: string; // e.g. relevant coursework
}

export interface SkillGroup {
  heading: string;
  skills: string[];
}

export interface Resume {
  name: string;
  jobTitle: string;
  location: string; // shown as the small eyebrow above your name in the hero
  specialties: string; // one line, e.g. "Backend · Distributed systems · Go"
  about: string;
  showPhoto: boolean;
  links: {
    github: string;
    linkedin: string;
    resumePdf?: string; // file placed in /public, e.g. "resume.pdf"
  };
  experience: Job[];
  projects: Project[];
  education: School[];
  honors?: string;
  skills: SkillGroup[];
}

export const resume: Resume = {
  name: "Flying Felix",
  jobTitle: "Software Developer",
  location: "City, ST · Detail",
  specialties: "Testing Software· UI · Backend · DevOps",
  about:
    "Welcome To My Cool Little website I'm going to be build my portfolio " +
    "Something Something.",
  showPhoto: true,

  links: {
    github: "https://github.com/FelixFalling",
    linkedin: "https://www.linkedin.com/in/username",
    resumePdf: undefined, // set to "resume.pdf" once you add the file to /public
  },

  experience: [
    {
      company: "Company Name",
      title: "Job Title",
      location: "City, ST",
      period: "Start – Present",
      bullets: [
        "Achievement or responsibility — what you did and the impact it had.",
        "Achievement or responsibility — what you did and the impact it had.",
        "Achievement or responsibility — what you did and the impact it had.",
      ],
    },
    {
      company: "Company Name",
      title: "Job Title",
      location: "City, ST",
      period: "Start – End",
      bullets: [
        "Achievement or responsibility — what you did and the impact it had.",
        "Achievement or responsibility — what you did and the impact it had.",
      ],
    },
  ],

  projects: [
    {
      eyebrow: "Year · Context",
      title: "Project Title",
      description:
        "Two or three sentences describing the project: what you built, the " +
        "technologies involved, and the measurable outcome.",
      tags: ["Tag", "Tag", "Tag"],
    },
    {
      eyebrow: "Year · Context",
      title: "Project Title",
      description:
        "Two or three sentences describing the project: what you built, the " +
        "technologies involved, and the measurable outcome.",
      link: { label: "View repository →", href: "#" },
      tags: ["Tag", "Tag", "Tag"],
    },
    {
      eyebrow: "Year · Context",
      title: "Project Title",
      description:
        "Two or three sentences describing the project: what you built, the " +
        "technologies involved, and the measurable outcome.",
      link: { label: "Live site →", href: "#" },
      tags: ["Tag", "Tag", "Tag"],
    },
  ],

  education: [
    {
      degree: "Degree Name",
      year: "Year",
      detail: "Institution · Detail · GPA",
      note: "Relevant coursework or other details",
    },
    {
      degree: "Degree Name",
      year: "Year",
      detail: "Institution · Detail · GPA",
      note: "Relevant coursework or other details",
    },
  ],
  honors: "Honors: Award · Award",

  skills: [
    { heading: "Languages", skills: ["Skill one", "Skill two", "Skill three"] },
    { heading: "Frameworks & Libraries", skills: ["Skill one", "Skill two", "Skill three"] },
    { heading: "DevOps & Cloud", skills: ["Skill one", "Skill two", "Skill three"] },
    { heading: "Testing", skills: ["Skill one", "Skill two", "Skill three"] },
    { heading: "Systems & Hardware", skills: ["Skill one", "Skill two", "Skill three"] },
    { heading: "Practices", skills: ["Skill one", "Skill two", "Skill three"] },
  ],
};
