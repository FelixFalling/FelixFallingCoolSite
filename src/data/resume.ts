/**
 * ─────────────────────────────────────────────────────────────────────────
 *  YOUR SITE CONTENT - edit everything here.
 * ─────────────────────────────────────────────────────────────────────────
 *  This is the ONE file you change to update the site's text. The components
 *  just render whatever you put here, so you never have to touch layout/HTML
 *  to change your name, projects, skills, etc.
 *
 *  PRIVACY NOTE: this site is public and scrapable. The display name is the
 *  owner's first name ("Nick") by choice; it still carries no last name,
 *  employers, school, location, or contact details beyond the GitHub link.
 *  Keep it minimal unless you decide otherwise. (The Experience/Education
 *  sections are currently hidden - see page.tsx.)
 *
 *  TypeScript tip: the `: SomeType` annotations below describe the shape of
 *  each piece of data. If you mistype a field (e.g. forget a project's title),
 *  your editor will underline it in red before you ever deploy. That's the
 *  whole point of TypeScript - catching mistakes early.
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
  src: string; // path under /public, e.g. "projects/clock-1.webp"
  alt: string; // describes the image for screen readers
  poster?: string; // still frame for animated previews and reduced motion
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
  /**
   * The small uppercase eyebrow above your name in the hero. Optional: leave
   * it out (or comment it out below) and the hero simply renders no eyebrow -
   * the name moves up to take the space.
   */
  location?: string;
  about: string;
  showPhoto: boolean;
  // Your profile image: put the file in /public (e.g. public/me.jpg) and set
  // this to its filename ("me.jpg"). Leave undefined to show the grey
  // placeholder circle instead. Only shows when showPhoto is true.
  photo?: string;
  links: {
    github: string;
    linkedin?: string; // hidden for now - ties the handle to a real identity
    resumePdf?: string; // file placed in /public, e.g. "resume.pdf"
  };
  experience: Job[];
  projects: Project[];
  games: Project[]; // the just-for-fun vibe-coded toys - own section below Projects
  education: School[];
  honors?: string;
  skills: SkillGroup[];
}

// The base path GitHub Pages serves from - used to build links to the
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
  name: "Nick",
  jobTitle: "Software Developer",
  //location: "Somewhere along a foggy coast",
  about:
    "I build software with a tester's mindset - automation, validation, and " +
    "documentation-driven development, from embedded firmware up to web " +
    "interfaces. This site is one of my projects: everything on it, from the " +
    "waves to the CI pipeline, is hand-built and open source.",
  /*
   * The hero photo circle is off, and the photo FILE is gone with it.
   *
   * Turning showPhoto off used to be the whole of it, and that was not enough:
   * everything in public/ is copied into the build whether the page links it
   * or not, so public/me.jpg went on being served at a guessable URL - a face,
   * on a site whose entire point is to carry no last name, no employer and no
   * LinkedIn. Hiding it from the page did not hide it from the web, and a
   * photo is the strongest identifier here by some distance.
   *
   * (It is still in this repo's git history, which is public. Removing the
   * file stops it being served and indexed - where crawlers and reverse image
   * search actually look - but does not erase it. Erasing it would mean
   * rewriting published history.)
   *
   * TO BRING A PHOTO BACK: put an image in public/, set `photo` to its
   * filename, and flip showPhoto to true. Weigh the identity trade-off first -
   * see the PRIVACY NOTE at the top of this file. tests/security.spec.ts fails
   * if a personal photo ships, so it will remind you to make that call
   * deliberately.
   */
  showPhoto: false,
  // photo: "me.jpg",   <- file deliberately removed; see above

  links: {
    github: "https://github.com/FelixFalling",
    // linkedin: intentionally omitted for now (see PRIVACY NOTE above)
    // The PDF is the PSEUDONYMOUS one-pager (source: scripts/resume-pdf.html)
    // - never upload the real resume here.
    resumePdf: "resume.pdf",
  },

  // Hidden for now (see page.tsx) - fill these in when you're ready to share.
  experience: [],

  projects: [
    {
      eyebrow: "2026 · Team of 3",
      title: "Rubber Duckie Terminator",
      description:
        "A real-time perception-to-actuation pipeline: a YOLOv8 detector " +
        "trained entirely on synthetic Blender renders (1,000+ auto-labeled " +
        "images - zero real photos) spots a rubber duck, an Intel RealSense " +
        "depth camera localizes it in metric 3D, and an Arduino-driven " +
        "two-servo laser turret tracks it live at 85–91% real-world " +
        "detection. Live RGB + depth monitoring UI in OpenCV.",
      links: [
        { label: "Watch the demo →", href: "https://www.youtube.com/watch?v=oliByOs1Yvc" },
        { label: "View the code →", href: "https://github.com/FelixFalling/Rubber-Duckie-Terminator" },
      ],
      images: [
        { src: "projects/animated/duck.gif", poster: "projects/animated/duck.webp", alt: "Illustrated duck detection loop with a tracking box and laser turret" },
        { src: "projects/ducky-1.webp", alt: "Live detection feed - RGB view with a duck bounding box beside the depth view" },
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
        { src: "projects/animated/wildfire.gif", poster: "projects/animated/wildfire.webp", alt: "Illustrated fire forecast spreading across terrain contours" },
        { src: "projects/wildfire-1.webp", alt: "The wildfire forecast dashboard - a WRF-SFIRE fire-spread simulation over a map" },
      ],
      tags: ["Python", "Deep learning", "HPC / SLURM", "Docker", "Geospatial"],
    },
    {
      eyebrow: "2026 · Personal",
      title: "Tic-Tac-Toe Q-Learning Agent",
      description:
        "A tabular Q-learning agent that learns tic-tac-toe from scratch " +
        "through self-play - no hardcoded strategy. Board states are encoded " +
        "as a base-3 integer to index the Q-table, moves are chosen with a " +
        "decaying epsilon-greedy policy, and rewards (+1 win, +0.5 draw, -1 " +
        "loss) propagate back through the game via the Q-learning update " +
        "rule. Trained over 5,000 self-play epochs and evaluated every " +
        "epoch against a random-move baseline, its win-or-draw rate climbs " +
        "from ~81% to ~95%.",
      links: [{ label: "View the code →", href: "https://github.com/FelixFalling/Tic-Tac-Toe-Agent" }],
      images: [
        { src: "projects/animated/tictactoe.gif", poster: "projects/animated/tictactoe.webp", alt: "Animated self-play sequence ending in a diagonal win" },
        { src: "projects/tictactoe-1.svg", alt: "A tic-tac-toe board mid-game, with X about to complete the top-left-to-bottom-right diagonal for the win" },
      ],
      tags: ["Python", "Reinforcement learning", "Q-learning", "NumPy", "Matplotlib"],
    },
    {
      eyebrow: "Collection · Python",
      title: "Classic AI, From Scratch",
      description:
        "AI and ML fundamentals implemented by hand: heuristic search, a " +
        "genetic algorithm for the eight-queens problem with population-size " +
        "experiments, and hand-rolled gradient descent - plus a " +
        "transfer-learning CNN in TensorFlow that reached 97.35% accuracy.",
      links: [
        { label: "♛ Genetic 8-queens →", href: "https://github.com/FelixFalling/eight_queens_problem" },
        { label: "Search →", href: "https://github.com/FelixFalling/problem-solving-search" },
        { label: "Transfer-learning CNN →", href: "https://github.com/FelixFalling/Transfer-Learning" },
      ],
      images: [
        { src: "projects/animated/queens.gif", poster: "projects/animated/queens.webp", alt: "Illustrated genetic search arranging eight non-attacking queens" },
        { src: "projects/queens-board.webp", alt: "Chessboard showing one valid 8-queens solution, with a queen chess piece emblem" },
        { src: "projects/queens-1.webp", alt: "Fitness-over-generations plot from the genetic 8-queens solver, population size 1000" },
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
        { src: "projects/animated/coast.gif", poster: "projects/animated/coast.webp", alt: "Animated moonlit coastal waves and sea stacks" },
        { src: "projects/site-light.webp", alt: "The portfolio homepage in light mode - fog and sea stacks under the hero" },
        { src: "projects/site-dark.webp", alt: "The portfolio homepage in dark mode - moonlit waves and stars" },
      ],
      tags: ["Next.js", "TypeScript", "Playwright", "GitHub Actions"],
    },
  ],

  // The just-for-fun corner - vibe-coded toys, shown in their own Games
  // section right below Projects.
  games: [
    {
      eyebrow: "Vibe-coded · Just for fun",
      title: "Curse of Ra",
      description:
        "Works out when you can clock out, disguised as an animated Egyptian " +
        "tomb - give it the time you came back from lunch and the decimal " +
        "hours your timeclock shows, and it counts down to the moment the " +
        "curse lifts, for a day or a whole period. Vibe-coded with an AI " +
        "pair as a side experiment: I directed, reviewed, and shipped it as " +
        "one self-contained HTML file.",
      links: [{ label: "Open the clock →", href: `${BASE_PATH}/clockmaker.html` }],
      images: [
        { src: "projects/animated/clock.gif", poster: "projects/animated/clock.webp", alt: "Animated golden clock inside an Egyptian tomb" },
        { src: "projects/clock-1.webp", alt: "The Curse of Ra clock at night - a moonlit Egyptian tomb with a golden clock" },
        { src: "projects/clock-2.webp", alt: "The Curse of Ra clock by day - sunbeams lighting the tomb in gold" },
      ],
      tags: ["HTML", "CSS animation", "Vanilla JS", "AI-assisted"],
    },
    {
      eyebrow: "Vibe-coded · Just for fun",
      title: "The Wizard's Tower",
      description:
        "An endless-climb browser game: a very normal cat, a laser dot, and " +
        "a tower that never ends. Bat things off shelves, dodge ghost " +
        "librarians, cursed grimoires, and darting wisps - and past 50 " +
        "meters, fight the wizard himself for boons and unlockable cats. " +
        "Vibe-coded: AI-paired, human-directed, one dependency-free HTML file.",
      links: [{ label: "Play it →", href: `${BASE_PATH}/ghost-cat.html` }],
      images: [
        { src: "projects/animated/wizard.gif", poster: "projects/animated/wizard.webp", alt: "Animated cat chasing a laser past shelves in a magical tower" },
        { src: "projects/wizard-2.webp", alt: "The Wizard's Tower gameplay - a cat chasing a laser dot up shelves, dodging ghost librarians" },
        { src: "projects/wizard-1.webp", alt: "The Wizard's Tower title screen with unlockable cat skins" },
      ],
      tags: ["JavaScript", "Game", "CSS", "AI-assisted"],
    },
  ],

  // Hidden for now (see page.tsx) - fill in when you're ready to share.
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
