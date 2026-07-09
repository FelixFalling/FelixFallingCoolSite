# FelixFallingCoolSite

My personal portfolio / resume site — built with **Next.js + TypeScript**, deployed
as a static site to **GitHub Pages** at
<https://felixfalling.github.io/FelixFallingCoolSite/>.

## Editing the site

You almost never need to touch layout code. To update your resume text, edit one file:

- **[`src/data/resume.ts`](src/data/resume.ts)** — your name, jobs, projects, skills, links, etc.

To change how things look:

- **[`src/app/globals.css`](src/app/globals.css)** — the color palette (top of the file) and shared styles.
- **`src/components/*.module.css`** — styles for one specific section (e.g. `Hero.module.css`).

The page is assembled in **[`src/app/page.tsx`](src/app/page.tsx)** — reorder or remove a
section by moving/deleting a line there.

## Running it locally

```bash
npm install      # first time only, installs dependencies
npm run dev      # live preview at http://localhost:3000/FelixFallingCoolSite
```

Edit a file and the browser refreshes automatically.

## Deploying

Just push to `main`. The GitHub Actions workflow
([`.github/workflows/static.yml`](.github/workflows/static.yml)) builds the site and
publishes it to GitHub Pages. To build locally and inspect the output:

```bash
npm run build    # writes the static site to ./out
```

## Project layout

```
src/
  app/
    layout.tsx      root <html>, site metadata
    page.tsx        assembles the page from the sections below
    globals.css     theme colors + shared styles
  components/       one file per section (Nav, Hero, Experience, ...)
  data/resume.ts    <- all your content lives here
public/
  clockmaker.html   the "Curse of Ra" clock page (linked bottom-left)
```
