/**
 * ─────────────────────────────────────────────────────────────────────────
 *  YOUR SITE CONTENT — edit everything here.
 * ─────────────────────────────────────────────────────────────────────────
 *  This is the ONE file you change to update the site's text. The components
 *  just render whatever you put here, so you never have to touch layout/HTML
 *  to change your name, projects, skills, etc.
 *
 *  PRIVACY NOTE: this site is public and scrapable. It deliberately uses the
 *  "Flying Felix" handle and contains no real name, employers, school, photo,
 *  location, or contact details. Keep it that way unless you decide otherwise.
 *  (The Experience/Education sections are currently hidden — see page.tsx.)
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

/** One slide in a project card's little slideshow. */
export interface ProjectImage {
  src: string; // path under /public, e.g. "projects/clock-1.png"
  alt: string; // describes the image for screen readers
}

export interface Project {
  eyebrow: string; // small label above the title, e.g. "2024 · Personal"
  title: string;
  description: string;
  links?: { label: string; href: string }[]; // "View repo →", "Watch demo →", …
  images?: ProjectImage[]; // screenshots shown as a swipeable slideshow
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
  // Your profile image: put the file in /public (e.g. public/me.jpg) and set
  // this to its filename ("me.jpg"). Leave undefined to show the grey
  // placeholder circle instead. Only shows when showPhoto is true.
  photo?: string;
  links: {
    github: string;
    linkedin?: string; // hidden for now — ties the handle to a real identity
    resumePdf?: string; // file placed in /public, e.g. "resume.pdf"
  };
  experience: Job[];
  projects: Project[];
  games: Project[]; // the just-for-fun vibe-coded toys — own section below Projects
  education: School[];
  honors?: string;
  skills: SkillGroup[];
}

// The base path GitHub Pages serves from — used to build links to the
// standalone pages in /public. Imported from the repo root so the app and the
// tests agree on it (see basePath.mjs).
import { BASE_PATH } from "../../basePath.mjs";

/**
 * Which link a project's clickable screenshots open: the code/repo link when
 * there is one, otherwise the project's first link. Lives here (not in the
 * component) so the site and the tests share one definition.
 */
export function primaryProjectLink(project: Project): { label: string; href: string } | undefined {
  return project.links?.find((link) => /code|repo/i.test(link.label)) ?? project.links?.[0];
}

export const resume: Resume = {
  name: "Flying Felix",
  jobTitle: "Software Developer",
  location: "Somewhere along a foggy coast",
  specialties: "Test automation · Embedded systems · DevOps",
  about:
    "I build software with a tester's mindset — automation, validation, and " +
    "documentation-driven development, from embedded firmware up to web " +
    "interfaces. This site is one of my projects: everything on it, from the " +
    "waves to the CI pipeline, is hand-built and open source.",
  // Shows a placeholder circle in the hero (no real photo — that stays off
  // the pseudonymous site). Drop a real image in later by replacing the
  // placeholder markup in sections/Hero.tsx.
  showPhoto: true,
  // photo: "me.jpg",  ← put your image in /public and uncomment this line

  links: {
    github: "https://github.com/FelixFalling",
    // linkedin: intentionally omitted for now (see PRIVACY NOTE above)
    // The PDF is the PSEUDONYMOUS one-pager (source: scripts/resume-pdf.html)
    // — never upload the real resume here.
    resumePdf: "resume.pdf",
  },

  // Hidden for now (see page.tsx) — fill these in when you're ready to share.
  experience: [],

  projects: [
    {
      eyebrow: "2026 · Team of 3",
      title: "Rubber Duckie Terminator",
      description:
        "A real-time perception-to-actuation pipeline: a YOLOv8 detector " +
        "trained entirely on synthetic Blender renders (1,000+ auto-labeled " +
        "images — zero real photos) spots a rubber duck, an Intel RealSense " +
        "depth camera localizes it in metric 3D, and an Arduino-driven " +
        "two-servo laser turret tracks it live at 85–91% real-world " +
        "detection. Live RGB + depth monitoring UI in OpenCV.",
      links: [
        { label: "Watch the demo →", href: "https://www.youtube.com/watch?v=oliByOs1Yvc" },
        { label: "View the code →", href: "https://github.com/FelixFalling/Rubber-Duckie-Terminator" },
      ],
      images: [
        { src: "projects/ducky-1.jpg", alt: "Live detection feed — RGB view with a duck bounding box beside the depth view" },
      ],
      tags: ["Python", "YOLOv8", "OpenCV", "Arduino", "Synthetic data"],
    },
    {
      eyebrow: "2025–26 · Capstone · Team lead",
      title: "Wildfire Forecast Dashboard",
      description:
        "Led a 5-person Agile team building a geospatial AI wildfire " +
        "forecasting system: physics-driven WRF-SFIRE simulations and " +
        "deep-learning inference run on a SLURM-scheduled GPU cluster. " +
        "Built Python (Pandas/NumPy) pipelines ingesting and validating " +
        "50GB+ of geospatial data, and shipped the Dockerized visualization " +
        "server behind the live site.",
      links: [{ label: "Visit the live site →", href: "https://wdt.cecs.pdx.edu/" }],
      images: [
        { src: "projects/wildfire-1.png", alt: "The wildfire forecast dashboard — a WRF-SFIRE fire-spread simulation over a map" },
      ],
      tags: ["Python", "Deep learning", "HPC / SLURM", "Docker", "Geospatial"],
    },
    {
      eyebrow: "Collection · Python",
      title: "Classic AI, From Scratch",
      description:
        "AI and ML fundamentals implemented by hand: heuristic search, a " +
        "genetic algorithm for the eight-queens problem with population-size " +
        "experiments, a tic-tac-toe game agent with legal-move and goal-state " +
        "logic, and hand-rolled gradient descent — plus a transfer-learning " +
        "CNN in TensorFlow that reached 97.35% accuracy.",
      links: [
        { label: "Game agent →", href: "https://github.com/FelixFalling/Tic-Tac-Toe-Agent" },
        { label: "♛ Genetic 8-queens →", href: "https://github.com/FelixFalling/eight_queens_problem" },
        { label: "Search →", href: "https://github.com/FelixFalling/problem-solving-search" },
        { label: "Transfer-learning CNN →", href: "https://github.com/FelixFalling/Transfer-Learning" },
      ],
      images: [
        { src: "projects/queens-board.png", alt: "Chessboard showing one valid 8-queens solution, with a queen chess piece emblem" },
        { src: "projects/queens-1.png", alt: "Fitness-over-generations plot from the genetic 8-queens solver, population size 1000" },
      ],
      tags: ["Python", "NumPy", "Genetic algorithms", "TensorFlow"],
    },
    {
      eyebrow: "2026 · This website",
      title: "This Portfolio Site",
      description:
        "A hand-built Next.js + TypeScript site with an animated Oregon-coast " +
        "scene: layered waves, drifting fog, sea stacks, and a light/dark " +
        "theme. Tested with Playwright on desktop and mobile, and deployed to " +
        "GitHub Pages by CI on every push.",
      links: [{ label: "View the code →", href: "https://github.com/FelixFalling/FelixFallingCoolSite" }],
      images: [
        { src: "projects/site-light.png", alt: "The portfolio homepage in light mode — fog and sea stacks under the hero" },
        { src: "projects/site-dark.png", alt: "The portfolio homepage in dark mode — moonlit waves and stars" },
      ],
      tags: ["Next.js", "TypeScript", "Playwright", "GitHub Actions"],
    },
  ],

  // The just-for-fun corner — vibe-coded toys, shown in their own Games
  // section right below Projects.
  games: [
    {
      eyebrow: "Vibe-coded · Just for fun",
      title: "Curse of Ra",
      description:
        "A work-hours punch clock disguised as an animated Egyptian tomb — " +
        "tap the cartouche to clock in and out, and it tracks your day and " +
        "your weekly 40 while the scene glitters around you. Vibe-coded " +
        "with an AI pair as a side experiment: I directed, reviewed, and " +
        "shipped it as one self-contained HTML file.",
      links: [{ label: "Open the clock →", href: `${BASE_PATH}/clockmaker.html` }],
      images: [
        { src: "projects/clock-1.png", alt: "The Curse of Ra clock at night — a moonlit Egyptian tomb with a golden clock" },
        { src: "projects/clock-2.png", alt: "The Curse of Ra clock by day — sunbeams lighting the tomb in gold" },
      ],
      tags: ["HTML", "CSS animation", "Vanilla JS", "AI-assisted"],
    },
    {
      eyebrow: "Vibe-coded · Just for fun",
      title: "The Wizard's Tower",
      description:
        "An endless-climb browser game: a very normal cat, a laser dot, and " +
        "a tower that never ends. Bat things off shelves, dodge ghost " +
        "librarians, cursed grimoires, and darting wisps — and past 50 " +
        "meters, fight the wizard himself for boons and unlockable cats. " +
        "Vibe-coded: AI-paired, human-directed, one dependency-free HTML file.",
      links: [{ label: "Play it →", href: `${BASE_PATH}/ghost-cat.html` }],
      images: [
        { src: "projects/wizard-2.png", alt: "The Wizard's Tower gameplay — a cat chasing a laser dot up shelves, dodging ghost librarians" },
        { src: "projects/wizard-1.png", alt: "The Wizard's Tower title screen with unlockable cat skins" },
      ],
      tags: ["JavaScript", "Game", "CSS", "AI-assisted"],
    },
  ],

  // Hidden for now (see page.tsx) — fill in when you're ready to share.
  education: [],
  honors: undefined,

  skills: [
    { heading: "Languages", skills: ["Python", "C/C++", "TypeScript / JavaScript", "Bash"] },
    { heading: "Testing & Validation", skills: ["Test automation", "Black-box & system validation", "Playwright", "Technical documentation"] },
    { heading: "Embedded & Hardware", skills: ["Arduino", "Raspberry Pi", "Serial protocols", "Firmware debugging", "OpenCV"] },
    { heading: "DevOps & Infrastructure", skills: ["Docker", "Terraform", "Ansible", "Proxmox", "CI/CD", "GitHub Actions"] },
    { heading: "Security", skills: ["Malware analysis", "YARA", "Suricata", "Packet analysis"] },
    { heading: "Web & UI", skills: ["Next.js", "React", "Node.js", "Qt / QML (PySide6)"] },
  ],
};
