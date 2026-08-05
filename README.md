# FelixFallingCoolSite

My personal portfolio / resume site - built with **Next.js + TypeScript**, deployed
as a static site to **GitHub Pages** at
<https://felixfalling.github.io/FelixFallingCoolSite/>.

The design is a moody Oregon-coast scene: sea stacks and a sweeping lighthouse
over waves breaking under the hero - with a light theme ("overcast day") and a
dark theme ("moonlit night").

## Quick start

```bash
npm install      # first time only
npm run dev      # live preview at http://localhost:3000/FelixFallingCoolSite
npm test         # run the automated browser tests
```

Edit a file and the browser refreshes automatically.

Before pushing, the same three checks CI runs - in the same order, cheapest
first:

```bash
npm run lint       # ESLint (Next's core-web-vitals + TypeScript rules)
npm run typecheck  # tsc --noEmit
npm run build      # the production static export -> ./out
```

`npm run dev` does **not** fail on a type error, so `npm test` alone can pass
while the real build is broken. That happened once; the build step in CI exists
because of it.

## The one-file rule: editing your content

**All the site's text lives in [`src/data/resume.ts`](src/data/resume.ts)** -
name, jobs, projects, education, skills, links. Edit that file and every section
updates. You never need to touch layout code to change what the site *says*.

## Project map

```
src/
  app/
    layout.tsx          root <html>, metadata, the no-flash theme script
    page.tsx            THE PAGE - an ordered list of sections. Reorder or
                        delete a line here to restructure the site.
    globals.css         ALL colors (theme tokens) + shared styles + keyframes
  components/
    sections/           one file per block of the page, top to bottom
      Hero.tsx          name, title, buttons - sits on top of the coast scene
      About.tsx  Projects.tsx  Games.tsx  Skills.tsx  Activity.tsx
      ProjectCards.tsx  the shared card list behind Projects and Games
      ActivityChart.tsx the GitHub contribution graph (a third-party image)
      Contact.tsx       the footer
      Experience.tsx  Education.tsx
                        written and working, but NOT on the page: page.tsx
                        leaves them out while the site stays pseudonymous,
                        and their arrays in resume.ts are empty
    scene/              the animated coastal diorama behind the hero
      HeroScene.tsx     assembles the layers + mouse parallax (the only file
                        here with JavaScript logic)
      Waves.tsx         4 drifting wave layers, tiled at a fixed width so
                        they flow on any screen size  ← numbers to tweak
      Shore.tsx         the rocks + lighthouse (drawn together so the
                        lighthouse always stands on its rock)
      Stars.tsx         faint stars (dark mode only)
      weather.ts  Rain.tsx  DuckRain.tsx (live weather + the easter egg)
    ui/                 shared building blocks used across pages
      Button.tsx        THE button (primary/ghost) - hero + 404 use it
      Section.tsx       the section scaffold (reveal + title) every section uses
      Card.tsx  Tag.tsx  ExternalLink.tsx   small shared pieces
      Nav.tsx           sticky top nav (server-rendered)
      NavLinks.tsx      just the section links + the "you are here" highlight -
                        split out so only this small piece ships as JavaScript
      ThemeToggle.tsx   the ☀️/🌙 button
      Reveal.tsx        fades sections in as you scroll to them
      Slides.tsx        the project screenshot slideshow
  data/
    resume.ts           ← YOUR CONTENT
tests/                  Playwright tests - Page Object Model (see below)
  fixtures.ts           wires page objects into every test
  pages/                one class per page (HomePage, NotFoundPage, BasePage)
  components/           objects for shared UI (NavBar, Footer, ProjectCard)
  *.spec.ts             the tests themselves
public/
  clockmaker.html       the Curse of Ra clock (standalone page)
  ghost-cat.html        The Wizard's Tower game (standalone page)
  manifest.json         web app manifest (installable to a home screen) +
  clock-manifest.json   a separate one for the clock, and icon-*.png
  resume.pdf            generated from scripts/resume-pdf.html - see below
  projects/             the screenshots the project cards show
```

## How theming works (change any color in one place)

Every color on the site is a CSS variable ("token") defined **once** at the top
of [`src/app/globals.css`](src/app/globals.css):

- `:root { … }` - the light theme
- `:root[data-theme="dark"] { … }` - the dark overrides

Components only ever say `var(--teal)`, never a hex code - so retuning a token
recolors the whole site consistently in both themes. A tiny script in
`layout.tsx` applies the saved theme before the first paint (no flash), and the
nav button just flips the `data-theme` attribute.

Tip while designing: force a theme from the URL with `?theme=dark` or
`?theme=light`.

## How the coast scene works

`HeroScene.tsx` stacks the layers back-to-front: stars → shore (rocks +
lighthouse) → waves → rain. Each layer is a small
file where the interesting parts are **plain data arrays** - positions, sizes,
speeds, opacities - with comments explaining each number. Want a fifth wave?
Add a line to `LAYERS` in `Waves.tsx`.

On desktop the scene drifts toward your cursor (parallax). Phones get the
ambient version, and visitors with "reduce motion" set in their OS get a still
scene - that's handled by the `prefers-reduced-motion` block in `globals.css`.

The scene is also **alive**: at night the lighthouse light turns like the real
thing - its beam sweeping and flashing as it points your way (`Shore.tsx`) -
and the wave speed and rain match the *actual current weather* on the Oregon
coast via Open-Meteo (`weather.ts` - free API, no key; if the request fails
the scene just keeps its defaults). And there's at least one easter egg. Try
typing something a certain terminator would hunt for.

## Automated tests (Playwright)

Real-browser tests live in [`tests/`](tests/). They start the dev server
themselves - you just run:

```bash
npm test                  # run everything headless
npm run test:ui           # interactive mode - watch the browser, time-travel
npx playwright codegen    # record your clicks as test code (great for learning)
npx playwright show-report  # open the HTML report from the last run
```

Every test runs **four times** - desktop and phone, in each of two browser
engines (the `projects` in [`playwright.config.ts`](playwright.config.ts)):

| project          | engine   | viewport            |
| ---------------- | -------- | ------------------- |
| `desktop`        | Chromium | Desktop Chrome      |
| `mobile`         | Chromium | Pixel 7             |
| `desktop-safari` | WebKit   | Desktop Safari      |
| `mobile-safari`  | WebKit   | iPhone 14           |
| `export`         | Chromium | the built `./out`   |

`export` is the odd one out and the important one: the four browser projects
all run against `next dev`, which is **not what ships**. Dev doesn't minify,
serves modules instead of built chunks, and runs code `next build` would
reject — so the suite could be green while the deployed site is broken. That
already happened once, when a CSS minifier dropped a transform hint out of a
keyframe and nothing noticed. The `export` project serves `./out` the way Pages
does and asserts on the built output (`tests/export.spec.ts`).

WebKit is there because it is the engine behind Safari and every browser on
iOS, where this site has already had a bug Chromium could not have shown
(the hero waves snapping back each loop). Chrome comes from your machine;
WebKit is downloaded once with `npx playwright install webkit`.

Run one project at a time while iterating - the full matrix is four times the
work:

```bash
npx playwright test --project=desktop
npx playwright test --project=mobile-safari
```

**The framework follows the Page Object Model (POM)** - the industry-standard
test architecture. Each page gets a class owning its locators and user
actions (`tests/pages/`), shared UI gets component objects (`tests/components/`),
and [`tests/fixtures.ts`](tests/fixtures.ts) injects them so a test reads like
a user story:

```ts
import { test, expect } from "./fixtures";

test("shows my name", async ({ homePage }) => {
  await homePage.goto();
  await expect(homePage.heroName).toBeVisible();
});
```

House rules: page objects hold locators + actions, **assertions stay in the
specs**; locators prefer accessible roles/names over CSS selectors; a selector
only ever needs changing in one place. The specs to copy from:

- `home.spec.ts` - page loads, sections render, links are right, no JS errors, 404 page
- `theme.spec.ts` - dark/light switching, persistence, dark-only stars
- `mobile.spec.ts` - no sideways scrolling, tappable buttons, and the GPU
  budget for the animated scene (phone projects only)
- `navigation.spec.ts` - the skip link, the nav's "you are here" highlight,
  and the scroll-reveal
- `game.spec.ts` - The Wizard's Tower: it starts, the boss spawns and can be
  reached (desktop only)
- `accessibility.spec.ts` - axe-core WCAG A/AA scans of both themes and the 404 page
- `shore.spec.ts` - the rocks stand in the water at every width, and don't
  snap size while a window is resized
- `deep-sea.spec.ts` - the dark-mode dive: depth, and the sea only darkening
- `export.spec.ts` - the built `./out` (the `export` project only): the
  minifier kept the rules the scene needs, the manifest's icons exist, the
  sitemap's URLs resolve, and the bundle runs without console errors

Tests import `resume.ts` directly, so they keep passing when you edit your
content - they check structure and behavior, not hardcoded strings.

## CI and deploying

Two GitHub Actions workflows run on every push to `main`:

- [`test.yml`](.github/workflows/test.yml) - lint → type-check → build →
  install WebKit → run the Playwright suite, in that order so an obvious
  mistake fails in seconds instead of after a full browser matrix. Runs on
  every pull request too, and gives the commit its green ✓ / red ✗.
- [`static.yml`](.github/workflows/static.yml) - builds the static site
  (`npm run build` → `./out`) and publishes it to GitHub Pages.

They're independent: a failed test never blocks a deploy. If you want failing
tests to block deploys later, add branch protection on `main` that requires the
"Tests" check.

**Worth knowing:** because they're independent, a commit that breaks the build
still triggers a deploy - which then fails, leaving the previous version live.
The site does not go down, it silently stops updating. If a change seems not to
have shipped, check the Actions tab before debugging the page.

## The site's own screenshots

The two images in the "This Portfolio Site" card are generated, not taken by
hand:

```bash
npm run screenshots   # builds, then shoots ./out and writes the webp files
```

They are **taken of the real static export**, not the dev server — the picture
on the site is a picture of the artifact that actually ships. Both are
committed, so review the diff before pushing.

Why it's a script: they used to be hand-made, and they rotted. For twelve days
the site showed a screenshot of itself branded "Flying Felix" — a name changed
back in `9bbd0cd` — alongside a hero reading "Nick". By then they also predated
the Games link, the centred hero and the redrawn sea.

The output is deterministic: the weather request is blocked (so the sea is
always at default speed, no rain, no golden hour) and every animation is pinned
to a fixed moment via the Web Animations API. Two runs produce byte-identical
files, so rerunning never creates a spurious diff. If you ever change that
code, check that property still holds:

```bash
npm run screenshots && shasum -a 256 public/projects/site-*.webp
npm run screenshots && shasum -a 256 public/projects/site-*.webp   # same hashes
```

## The resume PDF

The "Download resume ↓" button serves [`public/resume.pdf`](public/resume.pdf),
which is printed from [`scripts/resume-pdf.html`](scripts/resume-pdf.html):

```bash
google-chrome-stable --headless --disable-gpu --no-sandbox \
  --print-to-pdf=public/resume.pdf --no-pdf-header-footer \
  scripts/resume-pdf.html
```

⚠️ **That file duplicates content from `resume.ts` by hand** - the tagline, the
projects, the skills are all typed out a second time. Nothing keeps them in
sync, so editing `resume.ts` silently leaves the PDF stale. If you change your
content, change both. (Rendering the PDF from `resume.ts` instead would remove
this trap - it just hasn't been done yet.)

## Cheat sheet

| I want to…                       | Edit…                                          |
| -------------------------------- | ---------------------------------------------- |
| Change my resume text / links    | `src/data/resume.ts`                           |
| Change a color                   | tokens at the top of `src/app/globals.css`     |
| Reorder / remove a page section  | `src/app/page.tsx`                             |
| Restyle one section              | `src/components/sections/<Name>.module.css`    |
| Tune the waves / rocks / fog     | data arrays in `src/components/scene/*.tsx`    |
| Add a test                       | copy a spec in `tests/`                        |
| Show my job history / education  | fill the empty arrays in `src/data/resume.ts`, then add the sections back to `src/app/page.tsx` |
| Bring back the hero photo        | `showPhoto: true` in `src/data/resume.ts`      |
| Check a change before pushing    | `npm run lint && npm run typecheck && npm run build` |
