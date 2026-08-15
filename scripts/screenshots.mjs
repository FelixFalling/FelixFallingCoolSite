/**
 * Regenerates the site's own screenshots - public/projects/site-{light,dark}.webp,
 * the two images the "This Portfolio Site" card shows.
 *
 * WHY THIS EXISTS. Those images were taken by hand, and they rotted: for
 * twelve days the site showed a screenshot of itself branded "Flying Felix", a
 * name that had been changed in commit 9bbd0cd. By then they also predated the
 * Games nav link, the centred hero, the dive, and the retuned sea. A visitor
 * read one name in the hero and a different one in the picture below it.
 *
 * Hand-made screenshots of a site that changes weekly will always rot. Run:
 *
 *     npm run screenshots
 *
 * TAKEN OF THE REAL EXPORT, not the dev server (see scripts/serve-out.mjs).
 * The pictures on the site are now pictures of the artifact that actually
 * ships - minified CSS, built chunks and all.
 *
 * DETERMINISM. These files are committed, so a rerun that changes pixels for no
 * reason means a noisy diff and a pointless commit. Three sources of drift are
 * pinned:
 *
 *   • the live weather request is blocked, so the sea is always at its default
 *     speed with no rain layer and no golden-hour wash;
 *   • the analytics script is blocked (it changes nothing visually, but it is
 *     one less network race);
 *   • every CSS animation is paused at a fixed point in its cycle (see
 *     FREEZE_AT), so the waves, the lighthouse beam and the scroll cue land
 *     identically every time.
 *
 * On that last point: Playwright's built-in `animations: "disabled"` was tried
 * first and is the obvious choice, but it fast-forwards animations to their
 * END state - which left the lighthouse beam fully extended as a flat bar,
 * a pose it only passes through live. Pausing at a chosen moment is just as
 * deterministic and shows the scene as people actually see it.
 */
import { chromium } from "@playwright/test";
import sharp from "sharp";
import { resolve } from "node:path";
import { serveOut } from "./serve-out.mjs";

/** Capture size. 1440x900 is a real desktop, comfortably past the 1200px
 *  breakpoint, so the shot shows the desktop layout rather than the narrow
 *  one. Downscaled 1.5x to the 960x600 the card has always used. */
const VIEWPORT = { width: 1440, height: 900 };
const OUTPUT = { width: 960, height: 600 };

const PUBLIC_DIR = resolve(import.meta.dirname, "..", "public", "projects");

/**
 * Where in its cycle every animation is frozen, in milliseconds. Every
 * animation on the page is set to exactly this time and paused, so the frame
 * is a pure function of this number.
 *
 * Chosen against the beamTurn keyframes, which carry the lamp through a full
 * 360deg turn every 8s: 800ms is 36deg into it, so the beam is still reaching
 * out to the right over the water at about three quarters of its length, with
 * the faintest taper - the pose the lighthouse is recognisably in. Anywhere
 * near 2000ms (90deg) catches it edge-on and the beam is simply absent.
 */
const FREEZE_AT_MS = 800;

async function main() {
  const server = await serveOut();
  const browser = await chromium.launch();
  console.log(`serving the export at ${server.url}`);

  try {
    for (const theme of ["light", "dark"]) {
      const page = await browser.newPage({
        viewport: VIEWPORT,
        // Capture at 2x and downscale: the text and the lighthouse come out
        // far cleaner than shooting 960x600 directly.
        deviceScaleFactor: 2,
      });

      // Determinism, and courtesy - a screenshot run shouldn't ping anyone's
      // API or register as a page view.
      await page.route("**open-meteo**", (route) => route.abort());
      await page.route("**gc.zgo.at**", (route) => route.abort());

      await page.goto(`${server.url}?theme=${theme}`, { waitUntil: "load" });
      await page.locator("h1").waitFor({ state: "visible" });
      await page.waitForTimeout(600); // let the reveal settle

      // Pin every animation to the same moment in its cycle.
      //
      // Via the Web Animations API rather than CSS, and that detail matters:
      // the first version injected `animation-delay: -0.8s; animation-play-state:
      // paused`, which looks equivalent but is not. A negative delay only
      // SHIFTS the timeline - the animation's start time is still page load -
      // so the frozen frame depended on how many milliseconds after load the
      // stylesheet happened to land, and two runs produced different bytes.
      // Setting currentTime explicitly is absolute, so the output is now
      // identical run to run (there is a check for this in the README).
      await page.evaluate((freezeAtMs) => {
        for (const animation of document.getAnimations()) {
          animation.pause();
          animation.currentTime = freezeAtMs;
        }
      }, FREEZE_AT_MS);

      const png = await page.screenshot({ type: "png" });
      const file = resolve(PUBLIC_DIR, `site-${theme}.webp`);
      const { size } = await sharp(png)
        .resize(OUTPUT.width, OUTPUT.height)
        .webp({ quality: 82 })
        .toFile(file);

      console.log(`  site-${theme}.webp  ${OUTPUT.width}x${OUTPUT.height}  ${size} bytes`);
      await page.close();
    }
  } finally {
    await browser.close();
    await server.close();
  }

  console.log("done - remember these are committed, so review the diff");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
