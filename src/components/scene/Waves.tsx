/**
 * The animated ocean waves under the hero. Purely decorative.
 *
 * How it works: each layer is a row of identical SVG "tiles", every tile
 * exactly TILE (1200) pixels wide - one full wave period. Because the tiles
 * have a FIXED pixel width, the crests keep their shape on any screen: an
 * ultrawide monitor just sees more tiles, not a stretched-flat wave (the bug
 * the previous version had). The drift animation slides the whole row left or
 * right by exactly one tile, then loops - since the pattern repeats every
 * tile, the jump back is invisible.
 *
 * A second, inner element gently bobs each layer up and down ("swell").
 * Layers drift in opposite directions and at different speeds, which is what
 * makes it read as water rather than a sliding image. Live wind data speeds
 * everything up via --wave-speed (see weather.ts).
 *
 * TILES below is the MAXIMUM number of tiles; how many are actually drawn (and
 * how wide the row is) comes from Waves.module.css, which steps it up with the
 * viewport. That is load-bearing, not an optimization - see the note there.
 *
 * WHERE THE WATER SITS: these rows fill --water-height and stand on top of
 * --beach-height (the bare sand the swash runs over, see Swash.tsx), rather
 * than filling the whole strip. globals.css derives --waterline from the front
 * layer's crest position, so if you change that layer's `y` below, or the
 * bleed values, update --sand-crest-offset over there to match.
 *
 * All the animation timing is data below - tweak the numbers to taste.
 */

import styles from "./Waves.module.css";

const TILE = 1200; // px - one wave period; fixed so crests never flatten
const TILES = 6; // the most we ever draw (only on a ~6000px-wide monitor)

/** Build one irregular wave crest as an SVG path string (one 1200px period). */
function wavePath(y: number, a1: number, a2: number, a3: number, a4: number): string {
  return (
    `M0 ${y}` +
    ` C 90 ${y - a1}, 180 ${y - a1}, 300 ${y}` +
    ` S 420 ${y + a2}, 540 ${y + a2 * 0.4}` +
    ` S 680 ${y - a3}, 800 ${y - a3 * 0.5}` +
    ` S 950 ${y + a4}, 1060 ${y + a4 * 0.3}` +
    ` S 1160 ${y - a1 * 0.6}, 1200 ${y}` +
    ` L1200 200 L0 200 Z`
  );
}

interface Layer {
  fill: string;
  y: number;
  amps: [number, number, number, number];
  drift: "waveDrift" | "waveDrift2";
  driftDur: number; // seconds for one full loop
  swell: "waveSwell" | "waveSwell2";
  swellDur: number;
  opacity: number;
  foam: boolean; // draw a soft foam line on the crest
  // How far the drawing bleeds below its row, so the swell bobbing a layer
  // upward can never lift its bottom edge into view. The front (sand) layer
  // has to cover the whole beach as well, since its fill IS the beach.
  bleed: string;
}

// Back-to-front: faint far swell → deeper teal → breaking wave with foam → sand.
// Fills are theme tokens (defined in globals.css) so the waves recolor in dark
// mode. The top "sand" layer uses --sand - the page background - so the waves
// always look like they wash onto the page itself, in either theme.
// Drift durations are one full 1200px loop - short enough that the motion is
// unmistakable at a glance (the break layer travels ~110px every second).
const LAYERS: Layer[] = [
  { fill: "var(--wave-far)", y: 70, amps: [18, 12, 22, 14], drift: "waveDrift", driftDur: 26, swell: "waveSwell2", swellDur: 8, opacity: 0.5, foam: false, bleed: "28px" },
  { fill: "var(--wave-mid)", y: 100, amps: [24, 16, 28, 18], drift: "waveDrift2", driftDur: 17, swell: "waveSwell", swellDur: 6.5, opacity: 0.65, foam: false, bleed: "28px" },
  { fill: "var(--wave-break)", y: 124, amps: [20, 26, 16, 24], drift: "waveDrift", driftDur: 11, swell: "waveSwell2", swellDur: 5, opacity: 0.85, foam: true, bleed: "28px" },
  // The front layer paints the beach as well as the last of the water, so its
  // bleed has to reach the whole way down past the hero's bottom edge. Without
  // that you get a teal sliver along the bottom whenever the swell lifts it.
  { fill: "var(--sand)", y: 152, amps: [10, 14, 8, 12], drift: "waveDrift2", driftDur: 8.5, swell: "waveSwell", swellDur: 4.5, opacity: 1, foam: false, bleed: "calc(var(--beach-height) + 28px)" },
];

function WaveLayer({ layer }: { layer: Layer }) {
  const d = wavePath(layer.y, ...layer.amps);
  const openCrest = d.replace(/ L1200 200 L0 200 Z$/, ""); // just the crest line, for foam

  return (
    <div
      className={`wave-drift ${styles.row}`}
      style={{
        position: "absolute",
        left: 0,
        // The water stands ON the beach rather than filling the whole strip.
        bottom: "var(--beach-height)",
        height: "var(--water-height)",
        // Divided by --wave-speed (live wind data via HeroScene): windier on
        // the real coast means faster water here.
        animation: `${layer.drift} calc(${layer.driftDur}s / var(--wave-speed, 1)) linear infinite`,
        willChange: "transform",
        // Pins the row to a stable GPU layer on iOS, where 2D transform
        // animations can drop off the compositor and repaint per frame (the
        // waves read as flickering). Inline on purpose: the equivalent
        // translate3d hint in the keyframes gets minified back to 2D
        // translate() by the CSS optimizer, but it can't touch this.
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
      }}
    >
      <div
        className="wave-swell"
        style={{
          position: "absolute",
          inset: 0,
          animation: `${layer.swell} calc(${layer.swellDur}s / var(--wave-speed, 1)) ease-in-out infinite`,
          willChange: "transform",
          backfaceVisibility: "hidden", // see the note on the row above
          WebkitBackfaceVisibility: "hidden",
        }}
      >
        {Array.from({ length: TILES }, (_, i) => (
          <svg
            key={i}
            className={styles.tile}
            viewBox="0 0 1200 200"
            preserveAspectRatio="none"
            // The negative bottom bleeds each drawing below its row, so when
            // the swell bobs a layer upward (up to 15px) it can never lift its
            // bottom edge into view and flash whatever is behind it. The hero
            // clips the overflow, so the bleed itself is invisible.
            // No `display` here on purpose: it's an inline style, so it would
            // beat the module's rule and un-hide the tiles meant to stay off.
            style={{
              position: "absolute",
              left: i * TILE,
              bottom: `calc(-1 * ${layer.bleed})`,
              width: TILE,
              height: `calc(100% + ${layer.bleed})`,
            }}
          >
            {/* fill via style, not the SVG attribute, so the var(--…) resolves */}
            <path d={d} style={{ fill: layer.fill }} opacity={layer.opacity} />
            {layer.foam && (
              // Thin, soft, low-opacity foam - misty spray rather than a bright
              // line. The softness is TWO stacked strokes (a faint wide halo
              // under a stronger core), NOT filter: blur(). A blur filter on an
              // SVG path inside a layer that animates transform makes iOS
              // Safari re-run the filter as the layer's tiles move, and the
              // filtered stroke intermittently blanks - the waves "flicker".
              // Same rule in Swash.tsx; do not reintroduce filters here.
              <>
                <path d={openCrest} fill="none" style={{ stroke: "var(--wave-foam)" }} strokeWidth={5.5} strokeLinecap="round" opacity={0.16} />
                <path d={openCrest} fill="none" style={{ stroke: "var(--wave-foam)" }} strokeWidth={2.5} strokeLinecap="round" opacity={0.42} />
              </>
            )}
          </svg>
        ))}
      </div>
    </div>
  );
}

export default function Waves() {
  return (
    <div style={{ position: "absolute", inset: 0 }} aria-hidden="true">
      {LAYERS.map((layer) => (
        <WaveLayer key={layer.fill + layer.y} layer={layer} />
      ))}
    </div>
  );
}
