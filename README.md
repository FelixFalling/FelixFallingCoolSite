# FelixFallingCoolSite

My personal portfolio / resume site — built with **Next.js + TypeScript**, deployed
as a static site to **GitHub Pages** at
<https://felixfalling.github.io/FelixFallingCoolSite/>.

The design is a moody Oregon-coast scene: fog rolling over sea stacks, waves
breaking under the hero, gulls overhead — with a light theme ("overcast day")
and a dark theme ("moonlit night").

## Quick start

```bash
npm install      # first time only
npm run dev      # live preview at http://localhost:3000/FelixFallingCoolSite
npm test         # run the automated browser tests
```

Edit a file and the browser refreshes automatically.

## The one-file rule: editing your content

**All the site's text lives in [`src/data/resume.ts`](src/data/resume.ts)** —
name, jobs, projects, education, skills, links. Edit that file and every section
updates. You never need to touch layout code to change what the site *says*.

## Project map

```
src/
  app/
    layout.tsx          root <html>, metadata, the no-flash theme script
    page.tsx            THE PAGE — an ordered list of sections. Reorder or
                        delete a line here to restructure the site.
    globals.css         ALL colors (theme tokens) + shared styles + keyframes
  components/
    sections/           one file per block of the page, top to bottom
      Hero.tsx          name, title, buttons — sits on top of the coast scene
      About.tsx  Experience.tsx  Projects.tsx  Education.tsx  Skills.tsx
      Contact.tsx       the footer
    scene/              the animated coastal diorama behind the hero
      HeroScene.tsx     assembles the layers + mouse parallax (the only file
                        here with JavaScript logic)
      Waves.tsx         4 drifting wave layers        ← numbers to tweak
      SeaStacks.tsx     the offshore rocks            ← numbers to tweak
      Fog.tsx           rolling fog banks             ← fog thickness lives here
      Clouds.tsx  Gulls.tsx  Stars.tsx (stars = dark mode only)
    ui/                 shared pieces used around the page
      Nav.tsx           sticky top nav
      ThemeToggle.tsx   the ☀️/🌙 button
      Reveal.tsx        fades sections in as you scroll to them
      FunLink.tsx       the "Curse of Ra" pill (links to the clock page)
  data/
    resume.ts           ← YOUR CONTENT
tests/                  Playwright browser tests (see below)
public/
  clockmaker.html       the Curse of Ra clock (standalone page)
```

## How theming works (change any color in one place)

Every color on the site is a CSS variable ("token") defined **once** at the top
of [`src/app/globals.css`](src/app/globals.css):

- `:root { … }` — the light theme
- `:root[data-theme="dark"] { … }` — the dark overrides

Components only ever say `var(--teal)`, never a hex code — so retuning a token
recolors the whole site consistently in both themes. A tiny script in
`layout.tsx` applies the saved theme before the first paint (no flash), and the
nav button just flips the `data-theme` attribute.

Tip while designing: force a theme from the URL with `?theme=dark` or
`?theme=light`.

## How the coast scene works

`HeroScene.tsx` stacks the layers back-to-front: stars → clouds → gulls →
sea stacks → waves → fog. Each layer is a small file where the interesting
parts are **plain data arrays** — positions, sizes, speeds, opacities — with
comments explaining each number. Want a fifth wave? Add a line to `LAYERS` in
`Waves.tsx`. Fog too thick? Lower the `alpha` values in `Fog.tsx`.

On desktop the scene drifts toward your cursor (parallax). Phones get the
ambient version, and visitors with "reduce motion" set in their OS get a still
scene — that's handled by the `prefers-reduced-motion` block in `globals.css`.

## Automated tests (Playwright)

Real-browser tests live in [`tests/`](tests/). They start the dev server
themselves — you just run:

```bash
npm test                  # run everything headless
npm run test:ui           # interactive mode — watch the browser, time-travel
npx playwright codegen    # record your clicks as test code (great for learning)
npx playwright show-report  # open the HTML report from the last run
```

Every test runs twice: on a desktop-sized browser and on an emulated phone
(the `projects` in [`playwright.config.ts`](playwright.config.ts)). The specs
are written to copy from:

- `home.spec.ts` — page loads, sections render, links are right, no JS errors, 404 page
- `theme.spec.ts` — dark/light switching, persistence, dark-only stars
- `mobile.spec.ts` — no sideways scrolling, tappable buttons (phone project only)
- `accessibility.spec.ts` — axe-core WCAG A/AA scans of both themes and the 404 page

Tests import `resume.ts` directly, so they keep passing when you edit your
content — they check structure and behavior, not hardcoded strings.

## CI and deploying

Two GitHub Actions workflows run on every push to `main`:

- [`test.yml`](.github/workflows/test.yml) — runs the Playwright suite; you get
  a green ✓ / red ✗ on the commit (and on every pull request).
- [`static.yml`](.github/workflows/static.yml) — builds the static site
  (`npm run build` → `./out`) and publishes it to GitHub Pages.

They're independent: a failed test never blocks a deploy. If you want failing
tests to block deploys later, add branch protection on `main` that requires the
"Tests" check.

## Cheat sheet

| I want to…                       | Edit…                                          |
| -------------------------------- | ---------------------------------------------- |
| Change my resume text / links    | `src/data/resume.ts`                           |
| Change a color                   | tokens at the top of `src/app/globals.css`     |
| Reorder / remove a page section  | `src/app/page.tsx`                             |
| Restyle one section              | `src/components/sections/<Name>.module.css`    |
| Tune the waves / rocks / fog     | data arrays in `src/components/scene/*.tsx`    |
| Add a test                       | copy a spec in `tests/`                        |
