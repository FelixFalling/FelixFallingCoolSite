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

There are three files you edit to change the site, and between them they cover
almost everything you would want to change:

| To change… | Edit | Notes |
|---|---|---|
| the **words** | [`src/data/resume.ts`](src/data/resume.ts) | name, projects, skills, links |
| the **colours** | [`src/app/globals.css`](src/app/globals.css) | one token block, both themes |
| the **scene** | [`src/components/scene/tuning.ts`](src/components/scene/tuning.ts) | wave speeds, stars, the dive, live weather |

You never need to touch layout code to change what the site *says* or how the
coast *behaves*. A fourth file, [`thirdParty.mjs`](thirdParty.mjs), lists every
outside service the site talks to - see [Security](#security) for why that one
is not just documentation.

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
      tuning.ts         ← EVERY NUMBER THE SCENE USES. Wave speeds, star
                        positions, how fast the page sinks, where the live
                        weather is read from. Start here to retune anything.
      HeroScene.tsx     stacks the layers (no cursor parallax - see the note
                        in the file for why it was removed)
      Waves.tsx         draws the 4 wave layers described in tuning.ts, tiled
                        at a fixed width so they flow on any screen size
      crest.ts          the sum-of-sines crest generator the sea and the
                        panel waterlines share
      Shore.tsx         the rocks + lighthouse (drawn together so the
                        lighthouse always stands on its rock)
      Stars.tsx         faint stars (dark mode only)
      depth.ts          publishes how deep you have scrolled, as CSS vars
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
basePath.mjs            the GitHub Pages path, defined once
thirdParty.mjs          ← EVERY OUTSIDE SERVICE, defined once. The CSP is
                        generated from this and the tests enforce it.
scripts/
  csp.mjs               writes the Content-Security-Policy into ./out
  serve-out.mjs         serves ./out the way Pages does (tests + screenshots)
  screenshots.mjs       regenerates the site's own project screenshots
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
lighthouse) → waves → rain. Each layer is a small file that only *draws*; every
number it draws with is a plain data array in
[`scene/tuning.ts`](src/components/scene/tuning.ts), with a comment explaining
what it does. Want a fifth wave? Add a line to `WATER.layers` there.

A handful of those numbers are marked ⚠ - they are load-bearing, and the note
next to each says what breaks. (Short version: the 1200px tile and the
whole-number harmonics are what make the water loop seamlessly, and the `far`
and `mid` amplitudes are what stop the waves' pre-mixed colours going wrong.
`tests/waves.spec.ts` guards both.)

**There is deliberately no cursor parallax.** The scene used to shift toward the
pointer; it read as the horizon swaying under the mouse, which is a standard
vestibular trigger, and gating it behind `prefers-reduced-motion` was not enough
because most people it affects have never set that flag. The motion that remains
- drift, swell, stars - is slow and not coupled to anything you do. Visitors who
*have* set "reduce motion" get a still scene via the `prefers-reduced-motion`
block in `globals.css`.

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

## Security

The site is static, has no forms, no accounts, no cookies and no server, so most
web vulnerabilities simply have nowhere to live here. What is left is the risk of
*other people's code*, and the ordinary hygiene that stops a small mistake
becoming a large one. All of it is enforced by tests in
[`tests/security.spec.ts`](tests/security.spec.ts), which run against the built
`./out` rather than the dev server, because that is where these things either
exist or do not.

**The main site loads no third-party JavaScript.** There was a GoatCounter
analytics tag; it is gone. The account it reported to had never been claimed, so
every hit came back 400 and nothing was ever recorded - and an unclaimed code is
one that anybody else can register, which would have pointed this site's
visitors at a stranger. Removing it means `script-src` on the home and 404 pages
is now `'self'` plus per-build hashes and nothing else: the largest class of
supply-chain risk is not mitigated here, it is absent. A test holds that line.
(The clock page still loads three.js, pinned - see below. To bring analytics
back, claim the code first, then follow the note in `thirdParty.mjs`.)

**Every outside service is declared in one place.**
[`thirdParty.mjs`](thirdParty.mjs) lists each one with what it is for and which
CSP directives it belongs in. That file is not documentation - the policy is
generated from it, and a test scans the built HTML and fails if it finds a
request to any origin the file does not list. You cannot add a third party
without declaring it.

**The one remaining third-party script is pinned.** three.js on the clock page
carries a Subresource Integrity hash: the browser hashes what it downloaded and
refuses to run it if the bytes changed. If cdnjs is ever compromised, the clock
shows its error banner instead of executing someone else's code. One test checks
the hash in the markup matches the inventory; another fetches the live file and
checks the pin has not gone stale.

**Every page ships a Content-Security-Policy.** Written by
[`scripts/csp.mjs`](scripts/csp.mjs) as the second half of `npm run build`. It
allows no `unsafe-inline` and no `unsafe-eval` in `script-src` - inline scripts
are permitted by *hash*, computed per build from the bytes that shipped, so the
policy cannot go stale when you edit the theme script. `object-src`,
`form-action`, `frame-src` and `worker-src` are all `none`. A test loads each
page in a real browser and fails on any violation, which is what makes the
policy safe to tighten.

**Clickjacking, as far as this host allows.** `frame-ancestors` is the real
control and it is unavailable: GitHub Pages cannot send HTTP headers, so the
policy rides in a `<meta>` tag, and that is one of three directives a meta
policy must ignore. (Pages sends no `X-Frame-Options` either - checked.) The
fallback is a frame-breaker in the pre-paint script: framed, the page navigates
the top window to itself.

> **Know the limit.** An `<iframe sandbox>` without `allow-top-navigation`
> blocks that, and nothing more can be done from script inside such a frame.
> The stronger trick - hiding the document by default and revealing it only
> when unframed - is deliberately not used, because it turns the site into a
> blank page without JavaScript. That trade is easy here: nothing on this site
> takes a click that would matter if it were hijacked. **The proper fix**, if
> it ever hosts something that does, is a host or proxy that can set headers -
> a custom domain behind Cloudflare does it free - then `frame-ancestors
> 'none'` as a real header.

**Supply chain.** Workflow actions are pinned to full commit SHAs rather than to
movable tags like `@v4`, and [`dependabot.yml`](.github/dependabot.yml) opens a
weekly PR to keep both the SHAs and the npm packages current. The deploy
workflow's write permissions belong to the *deploy* job only - the `build` job,
which is the one that executes hundreds of npm packages, is read-only.

**If you change any of this,** run `npm test`. To convince yourself the tests
actually work, break something on purpose - delete an `integrity=` attribute
from `public/clockmaker.html`, or add `'unsafe-inline'` to the policy in
`scripts/csp.mjs` - and watch which test goes red.

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

Both workflows pin their actions to commit SHAs and request the narrowest token
they can - see [Security](#security).

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
| Tune the waves / stars / rain    | `src/components/scene/tuning.ts`               |
| Move the rocks / lighthouse      | the `<Cluster>` props in `src/components/scene/Shore.tsx` |
| Add / remove a third-party service | `thirdParty.mjs` (the CSP and the tests follow it) |
| Change the security policy       | `POLICY` in `scripts/csp.mjs`                  |
| Re-pin a CDN script after an update | the hash in `thirdParty.mjs`; `npm test` tells you when one goes stale |
| Add a test                       | copy a spec in `tests/`                        |
| Show my job history / education  | fill the empty arrays in `src/data/resume.ts`, then add the sections back to `src/app/page.tsx` |
| Bring back the hero photo        | `showPhoto: true` in `src/data/resume.ts`      |
| Check a change before pushing    | `npm run lint && npm run typecheck && npm test` |
