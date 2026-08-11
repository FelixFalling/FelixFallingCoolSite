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
 * WHERE THE WATER SITS: these rows fill the whole .waves-strip from the
 * bottom up. The front (sand) layer is filled with --sand, the page
 * background, so the sea always looks like it washes onto the page itself.
 *
 * All the animation timing is data below - tweak the numbers to taste.
 */

import styles from "./Waves.module.css";

const TILE = 1200; // px - one wave period; fixed so crests never flatten
const TILES = 6; // the most we ever draw (only on a ~6000px-wide monitor)

/**
 * One sine component of a crest: `k` whole cycles across the tile, `a` px of
 * amplitude, `p` radians of phase.
 *
 * `k` MUST be a whole number, and that is the invariant the entire wave system
 * rests on. A sum of sines whose frequencies are all whole cycles per tile
 * repeats exactly every TILE px - in value AND in slope - so the tiles meet
 * with no seam and the drift animation can go on sliding the row by exactly
 * one tile forever. Any fractional k breaks the loop. Guarded by
 * tests/waves.spec.ts.
 */
type Harmonic = readonly [k: number, a: number, p: number];

/**
 * Build one crest as a sum of sines, emitted as smooth cubic Béziers.
 *
 * WHY A SUM OF SINES. Every layer used to come out of one hand-placed Bézier
 * template that took four amplitudes - so all four layers were the SAME curve
 * at different sizes, repeating on the same 1200px lattice, their crests
 * lining up in the same arrangement all the way across. That similarity is
 * most of what read as flat: it looks like patterned wallpaper, because it is.
 *
 * Adding harmonics together fixes it at the source. Each layer gets its own
 * mix of frequencies and its own phases, so the silhouettes are genuinely
 * different shapes rather than one shape rescaled, and no two layers share a
 * rhythm. It also gives depth an honest control: distance compresses waves, so
 * the far layers are small and made of fast harmonics (fine chop) while the
 * near ones are dominated by a single slow one (long swell).
 *
 * All of it still tiles on the original 1200px period, which is what keeps the
 * drift keyframes, the row widths in Waves.module.css and the GPU budget
 * exactly as they were.
 */
function crestPath(baseY: number, harmonics: readonly Harmonic[], sharpen: number): string {
  /* Four samples per cycle of the FASTEST harmonic. Cubic Hermite with exact
     tangents is accurate to about 1.6% of amplitude at that rate - under half
     a pixel at these sizes - and every extra sample is bytes in the HTML, up
     to six times over on a wide monitor. */
  const kMax = Math.max(...harmonics.map(([k]) => k));
  const steps = Math.max(16, kMax * 4);
  const h = TILE / steps;

  const w = (k: number) => (2 * Math.PI * k) / TILE;
  const amp = harmonics.reduce((sum, [, a]) => sum + a, 0);

  const raw = (x: number) =>
    harmonics.reduce((sum, [k, a, p]) => sum + a * Math.sin(w(k) * x + p), 0);
  const rawSlope = (x: number) =>
    harmonics.reduce((sum, [k, a, p]) => sum + a * w(k) * Math.cos(w(k) * x + p), 0);

  /* SHARPEN THE CRESTS. A plain sum of sines is symmetric - every crest is the
     mirror of every trough - and real water is not: waves peak and troughs are
     broad and flat. That asymmetry is most of what separates a wave silhouette
     from a ribbon, so it is worth putting back.

     Adding a fraction of the square does it in one term. u + q·u² lifts the
     crests (u > 0) and fills in the troughs (u < 0), with q scaled so
     `sharpen` is the fraction by which a full-height crest grows. Squaring
     also shifts the mean up, so the mean over the tile comes back off - that
     keeps the water centred on its baseline instead of creeping upward as the
     sharpening is turned up.

     Any smooth function of a periodic function is still periodic, so this
     leaves the seamless tiling exactly as it was. */
  const q = amp > 0 ? sharpen / amp : 0;
  let mean = 0;
  for (let i = 0; i < steps; i++) mean += q * raw(i * h) ** 2;
  mean /= steps;

  // SVG y grows DOWNWARD, so a positive height is a crest above the baseline.
  const yAt = (x: number) => baseY - (raw(x) + q * raw(x) ** 2 - mean);
  const dyAt = (x: number) => -rawSlope(x) * (1 + 2 * q * raw(x));

  const r = (n: number) => Number(n.toFixed(1));

  let d = `M0 ${r(yAt(0))}`;
  for (let i = 0; i < steps; i++) {
    const x0 = i * h;
    const x1 = x0 + h;
    /* Hermite → Bézier: put each control point a third of the way along that
       end's tangent. Matching the SLOPE at both ends is what lets four samples
       per cycle reproduce a sine, instead of merely passing through it. */
    d +=
      ` C${r(x0 + h / 3)} ${r(yAt(x0) + (dyAt(x0) * h) / 3)}` +
      `,${r(x1 - h / 3)} ${r(yAt(x1) - (dyAt(x1) * h) / 3)}` +
      `,${r(x1)} ${r(yAt(x1))}`;
  }
  return d;
}

interface Layer {
  fill: string;
  y: number; // the crest's baseline, in the 0-200 viewBox
  harmonics: readonly Harmonic[];
  /** How much the crests peak and the troughs flatten, as the fraction by
      which a full-height crest grows. 0 is a plain sum of sines, symmetric
      and ribbon-like. Nearer water gets more of it: that asymmetry is only
      visible when the wave is big enough to show it. */
  sharpen: number;
  drift: "waveDrift" | "waveDrift2";
  driftDur: number; // seconds for one full loop
  swell: "waveSwell" | "waveSwell2";
  swellDur: number;
  /** Seconds of head start on the swell. Without it all four layers bob in
      unison for the first seconds after load, which reads as one sheet of
      water hinging rather than four depths of it. */
  swellOffset: number;
  /** How brightly light catches this crest, 0 (none) to 1. Scales the width
      AND the opacity of the highlight, so nearer crests are brighter and
      thicker - a depth cue in their own right. 1 reproduces exactly the foam
      the breaking layer has always had. */
  crest: number;
  // How far the drawing bleeds below its row, so the swell bobbing a layer
  // upward can never lift its bottom edge into view. The front (sand) layer
  // has to cover the whole beach as well, since its fill IS the beach.
  bleed: string;
}

// Back-to-front: faint far swell → deeper teal → breaking wave with foam → the
// shallow wash that meets the page. Fills are theme tokens (globals.css) so the
// waves recolor in dark mode.
//
// THE SEA IN PERSPECTIVE. Distance compresses waves: far off you see a lot of
// small, fast ripples packed into very little height, and up close a few tall,
// slow swells. The four layers are built to that rule, and it is where the
// depth comes from now that they are no longer one shape at four sizes.
//
//   far    baseline 70, ~7px of rise, fine chop (k = 3, 5, 8)
//   mid    baseline 99, ~16px, a mix (k = 2, 3, 7)
//   break  baseline 124, ~28px led by ONE slow swell (k = 1, 2, 5)
//   front  baseline 152, ~12px - the shallow wash that meets the page
//
// The near crests can rise ABOVE the layers behind them, and should - a close
// swell occluding the far water is a depth cue, and forbidding it is what made
// the old sea look like stage flats. It costs a little colour accuracy, since
// each fill is pre-mixed assuming the layer behind it is what shows through
// (see --wave-*-solid in globals.css). The error is under 3/255 per channel in
// both themes. The one pair where it would be worst - and where it would land
// on the sea's top edge against the sky, the easiest place to see it - is far
// and mid, and those two are sized so it cannot happen at all.
// tests/waves.spec.ts holds that line.
//
// EVERY LAYER IS OPAQUE. They used to be the raw --wave-* tokens at opacity
// 0.5 / 0.65 / 0.85, which is where the haze came from - but transparent water
// shows you what is behind it, and what is behind it is the sea stacks. You
// could see the islands through the waves, and a crest crossing a rock looked
// like a line drawn on the rock.
//
// The front layer uses --waterline-fill so the waves always look like they
// wash onto whatever is actually behind them: the page background at the top,
// and - once you start scrolling down in dark mode - the water you are sinking
// into. Filling it with plain --sand left a dark band between the crest and
// the sea, which was the last visible seam at the waterline.
//
// Drift durations are one full 1200px loop, and they ramp with depth too: the
// far water crawls, the breaking layer travels ~110px every second.
const LAYERS: Layer[] = [
  { fill: "var(--wave-far-solid)", y: 70, harmonics: [[3, 5.5, 0.0], [5, 3.4, 2.3], [8, 1.8, 4.1]], sharpen: 0.15, drift: "waveDrift", driftDur: 26, swell: "waveSwell2", swellDur: 8, swellOffset: 0, crest: 0.3, bleed: "28px" },
  { fill: "var(--wave-mid-solid)", y: 99, harmonics: [[2, 10, 1.4], [3, 5.5, 3.7], [7, 2.2, 0.5]], sharpen: 0.3, drift: "waveDrift2", driftDur: 17, swell: "waveSwell", swellDur: 6.5, swellOffset: -2.1, crest: 0.55, bleed: "28px" },
  { fill: "var(--wave-break-solid)", y: 124, harmonics: [[1, 15, 2.7], [2, 8.5, 5.1], [5, 3.4, 1.2]], sharpen: 0.4, drift: "waveDrift", driftDur: 11, swell: "waveSwell2", swellDur: 5, swellOffset: -1.3, crest: 1, bleed: "28px" },
  { fill: "var(--waterline-fill)", y: 152, harmonics: [[1, 7.5, 4.6], [3, 4.2, 1.9], [4, 2.1, 3.0]], sharpen: 0.25, drift: "waveDrift2", driftDur: 8.5, swell: "waveSwell", swellDur: 4.5, swellOffset: -3.4, crest: 0, bleed: "28px" },
];

function WaveLayer({ layer }: { layer: Layer }) {
  const crest = crestPath(layer.y, layer.harmonics, layer.sharpen);
  const body = `${crest} L${TILE} 200 L0 200 Z`; // crest, then down and back to fill the water

  return (
    <div
      className={`wave-drift ${styles.row}`}
      style={{
        position: "absolute",
        left: 0,
        bottom: 0,
        height: "100%",
        // Divided by --wave-speed (live wind data via HeroScene): windier on
        // the real coast means faster water here.
        animation: `${layer.drift} calc(${layer.driftDur}s / var(--wave-speed, 1)) linear infinite`,
        // will-change composites the drifting row on its own GPU layer.
        // DO NOT add backface-visibility/translateZ here: it was tried as extra
        // GPU pinning during the flicker fix, but on iOS it made the row
        // visibly SNAP BACK at every animation restart. The loop is otherwise
        // seamless (the tiles repeat every 1200px, so translating one tile and
        // resetting lands on identical pixels); the 3D-context hint was making
        // Safari flash that reset. The flicker itself was cured by the
        // filter-free foam below, so this hint was only ever redundant.
        willChange: "transform",
      }}
    >
      <div
        className="wave-swell"
        style={{
          position: "absolute",
          inset: 0,
          animation: `${layer.swell} calc(${layer.swellDur}s / var(--wave-speed, 1)) ease-in-out infinite`,
          // A negative delay starts the layer part-way into its cycle. MUST
          // come after `animation`, which is a shorthand and would reset it.
          animationDelay: `${layer.swellOffset}s`,
          willChange: "transform", // no backface-visibility here either - see the row note
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
            <path d={body} style={{ fill: layer.fill }} />
            {layer.crest > 0 && (
              // Light on the crest: thin, soft and low-opacity - misty spray
              // rather than a bright line. The softness is TWO stacked strokes
              // (a faint wide halo under a stronger core), NOT filter: blur().
              // A blur filter on an SVG path inside a layer that animates
              // transform makes iOS Safari re-run the filter as the layer's
              // tiles move, and the filtered stroke intermittently blanks - the
              // waves "flicker". Keep this filter-free: do not add blur here.
              //
              // Only the breaking layer used to get this. Giving every layer a
              // share of it, graded by nearness, is a big part of the sea
              // reading as water: a real one is covered in scattered light,
              // and a band with no highlight at all looks like paper.
              <>
                <path d={crest} fill="none" style={{ stroke: "var(--wave-foam)" }} strokeWidth={5.5 * layer.crest} strokeLinecap="round" opacity={0.16 * layer.crest} />
                <path d={crest} fill="none" style={{ stroke: "var(--wave-foam)" }} strokeWidth={2.5 * layer.crest} strokeLinecap="round" opacity={0.42 * layer.crest} />
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
