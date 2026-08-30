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

import { crestCaps, crestPath, TILE, type Harmonic, type Shape } from "./crest";
import styles from "./Waves.module.css";

const TILES = 6; // the most we ever draw (only on a ~6000px-wide monitor)

interface Layer {
  fill: string;
  y: number; // the crest's baseline, in the 0-200 viewBox
  harmonics: readonly Harmonic[];
  /** How much the crests peak and the troughs flatten, as the fraction by
      which a full-height crest grows. 0 is a plain sum of sines, symmetric
      and ribbon-like. Nearer water gets more of it: that asymmetry is only
      visible when the wave is big enough to show it. */
  sharpen: number;
  /** Trochoidal crest sharpening, and how far the crests tip over. See Shape
      in crest.ts - `steep` is what turns these from hills into waves, and the
      lean is signed to match the direction this layer drifts. */
  steep: number;
  lean: number;
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
  /** White water, 0 to 1. Not the same thing as `crest` above: that is
      scattered light along the whole silhouette, this is foam, and it is gated
      on height so only the waves tall enough to break go white. Which ones
      those are changes as the harmonics beat against each other, so the train
      breaks unevenly the way a real one does. */
  breaks: number;
  /** How far down the face the white water runs, measured from the tallest
      crest toward the baseline. Past 1 it goes below the mean line, which is
      what the shallow wash wants: a beach waterline is foamy along most of its
      length, not only at the tips. */
  breakReach: number;
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
//   far    baseline 60, k = 4/6/9, fine chop that barely rises
//   mid    baseline 101, k = 4/5/7
//   break  baseline 128, k = 3/4/7 - the tall one, and the one that breaks
//   front  baseline 152, k = 2/3/5 - the shallow wash that meets the page
//
// The rule is right but it used to be pushed too far: the near layers were led
// by k = 1, one crest per 1200px, and a wave a whole screen wide does not read
// as a wave at all. It reads as terrain. So the whole set moved up a few
// cycles, keeping the ordering (the far band is still the finest chop, the
// wash still the longest roll) but putting a TRAIN of waves in every band
// rather than a single hump.
//
// SHAPE comes from `steep` and `lean` on top of that, and they are what make
// these crests read as water rather than as a nicely drawn ribbon: `steep`
// displaces the surface sideways so crests come to a point over long flat
// troughs, and `lean` tips each one over the way it drifts. Both are explained
// at Shape in crest.ts. Sharpen is kept low now that steep does that job.
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
  { fill: "var(--wave-far-solid)", y: 60, harmonics: [[4, 1.8, 4.1], [6, 7.0, 0.0], [9, 3.6, 2.3]], sharpen: 0.08, steep: 0.5, lean: -0.25, drift: "waveDrift", driftDur: 26, swell: "waveSwell2", swellDur: 8, swellOffset: 0, crest: 0.3, breaks: 0, breakReach: 0, bleed: "28px" },
  { fill: "var(--wave-mid-solid)", y: 101, harmonics: [[4, 13, 1.4], [5, 6.0, 3.7], [7, 2.2, 0.5]], sharpen: 0.12, steep: 0.58, lean: 0.3, drift: "waveDrift2", driftDur: 17, swell: "waveSwell", swellDur: 6.5, swellOffset: -2.1, crest: 0.4, breaks: 0.5, breakReach: 0.5, bleed: "28px" },
  { fill: "var(--wave-break-solid)", y: 128, harmonics: [[3, 19, 2.7], [4, 9.0, 5.1], [7, 3.4, 1.2]], sharpen: 0.15, steep: 0.62, lean: -0.3, drift: "waveDrift", driftDur: 11, swell: "waveSwell2", swellDur: 5, swellOffset: -1.3, crest: 0.7, breaks: 1, breakReach: 0.55, bleed: "28px" },
  { fill: "var(--waterline-fill)", y: 152, harmonics: [[2, 9.0, 4.6], [3, 4.5, 1.9], [5, 2.2, 3.0]], sharpen: 0.1, steep: 0.5, lean: 0.28, drift: "waveDrift2", driftDur: 8.5, swell: "waveSwell", swellDur: 4.5, swellOffset: -3.4, crest: 0, breaks: 0.7, breakReach: 1.25, bleed: "28px" },
];

function WaveLayer({ layer }: { layer: Layer }) {
  const shape: Shape = { steep: layer.steep, lean: layer.lean };
  const crest = crestPath(layer.y, layer.harmonics, layer.sharpen, shape);
  const body = `${crest} L${TILE} 200 L0 200 Z`; // crest, then down and back to fill the water
  // The white water. One path, stroked twice at different widths below - the
  // long faint scattered light along the whole crest is already being drawn,
  // so this only has to supply the foam that sits on top of it.
  const caps = layer.breaks > 0 ? crestCaps(layer.y, layer.harmonics, layer.sharpen, shape, layer.breakReach) : "";

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
            {caps && (
              // The white water itself, sitting on top of the scattered light:
              // the same two-stroke stack, so it stays soft-edged without a
              // blur filter. Both strokes are the same `d`, which costs almost
              // nothing once the page is compressed.
              <>
                <path d={caps} fill="none" style={{ stroke: "var(--wave-foam)" }} strokeWidth={5.6 * layer.breaks} strokeLinecap="round" opacity={0.2 * layer.breaks} />
                <path d={caps} fill="none" style={{ stroke: "var(--wave-foam)" }} strokeWidth={2.6 * layer.breaks} strokeLinecap="round" opacity={0.42 * layer.breaks} />
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
