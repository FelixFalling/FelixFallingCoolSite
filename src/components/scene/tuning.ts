/**
 * ─────────────────────────────────────────────────────────────────────────
 *  ✎  THE SCENE'S DIALS - every number you might want to change, in one file.
 * ─────────────────────────────────────────────────────────────────────────
 *
 *  data/resume.ts is the one file you edit to change the site's WORDS. This is
 *  the one you edit to change how the coast BEHAVES: how fast the water moves,
 *  how many stars there are, how quickly the page sinks, where on the real
 *  Oregon coast the weather comes from.
 *
 *  Nothing here decides how anything is drawn - the components own that. These
 *  are only the values they draw with, gathered so that tuning the scene is
 *  reading one file instead of hunting through seven.
 *
 *  ── HOW TO USE IT ────────────────────────────────────────────────────────
 *
 *  Change a number, save, and look. `npm run dev` hot-reloads, so the sea
 *  retunes as you type. Nothing here can break the build - they are all plain
 *  numbers - but a few of them CAN break the illusion, and those are marked
 *  ⚠ with the reason. Read those notes before changing them; they are each
 *  there because something once went wrong.
 *
 *  ── COLOURS ARE NOT HERE ─────────────────────────────────────────────────
 *
 *  Every colour is a CSS variable in app/globals.css, because they have to
 *  change with the light/dark theme and CSS is what knows the theme. Look for
 *  the token block at the top of that file.
 *
 *  ── WHAT READS WHAT ──────────────────────────────────────────────────────
 *
 *    WATER      → scene/Waves.tsx      the hero's sea
 *    WATERLINE  → ui/Waterline.tsx     the little wave at the foot of a panel
 *    SKY        → scene/Stars.tsx      stars and meteors (dark theme only)
 *    DIVE       → scene/depth.ts       how the page sinks as you scroll
 *    WEATHER    → scene/weather.ts     the live conditions the scene follows
 *    RAIN       → scene/Rain.tsx       the drizzle layer, when it is raining
 *    DUCKS      → scene/DuckRain.tsx   the "duck" easter egg
 *
 *  ── WHAT IS DELIBERATELY NOT HERE ────────────────────────────────────────
 *
 *  The rocks and the lighthouse (scene/Shore.tsx). Each cluster is one
 *  hand-drawn SVG, and its position is a prop on the drawing itself. Pulling
 *  the three numbers out would separate them from the artwork they belong to
 *  and make both harder to read - the test of a file like this is whether it
 *  helps, not whether it is exhaustive.
 */

import type { Harmonic } from "./crest";

/* ══════════════════════════════════════════════════════════════════════════
 *  THE HERO'S SEA
 * ══════════════════════════════════════════════════════════════════════════ */

/**
 * ⚠ One full wave period, in px, and the number the whole wave system rests
 * on. DO NOT change it casually.
 *
 * Every layer is a row of identical tiles exactly this wide, and the drift
 * animation slides a row left by exactly one tile before looping. That loop is
 * invisible only because the pattern repeats on this exact distance. Three
 * other things are matched to it: the @keyframes in globals.css, the row
 * widths in Waves.module.css, and the whole-number harmonics below.
 *
 * It is a FIXED pixel width rather than a percentage on purpose - that is what
 * keeps a crest the same shape on a phone and on an ultrawide monitor. An
 * ultrawide simply sees more tiles. (Making it relative was the bug the
 * previous version of the sea had: the crests stretched flat.)
 */
export const TILE = 1200;

/**
 * One layer of water. Back-to-front, later layers are nearer the viewer.
 *
 * See scene/crest.ts for how `harmonics` become a curve, and the note above
 * WATER.layers for why the four layers are shaped the way they are.
 */
export interface WaveLayerSpec {
  /** A CSS colour, almost always a var() from globals.css. */
  fill: string;
  /** The crest's baseline in the 0-200 viewBox. Larger = lower on screen. */
  y: number;
  /** ⚠ Whole-number `k` only - see the Harmonic docs in crest.ts. */
  harmonics: readonly Harmonic[];
  /**
   * How much the crests peak and the troughs flatten, as the fraction by which
   * a full-height crest grows. 0 is a plain sum of sines, symmetric and
   * ribbon-like. Nearer water gets more of it: that asymmetry is only visible
   * when the wave is big enough to show it.
   */
  sharpen: number;
  /** Which drift keyframe (globals.css). The two run in opposite directions. */
  drift: "waveDrift" | "waveDrift2";
  /** Seconds for one full 1200px loop. Lower = faster water. */
  driftDur: number;
  /** Which swell keyframe - the gentle up-and-down bob. */
  swell: "waveSwell" | "waveSwell2";
  swellDur: number;
  /**
   * Seconds of head start on the swell, as a NEGATIVE number. Without it all
   * four layers bob in unison for the first seconds after load, which reads as
   * one sheet of water hinging rather than four depths of it.
   */
  swellOffset: number;
  /**
   * How brightly light catches this crest, 0 (none) to 1. Scales the width AND
   * the opacity of the highlight, so nearer crests are brighter and thicker - a
   * depth cue in its own right. 1 reproduces exactly the foam the breaking
   * layer has always had.
   */
  crest: number;
  /**
   * How far the drawing bleeds below its row, so the swell bobbing a layer
   * upward can never lift its bottom edge into view.
   */
  bleed: string;
}

export const WATER = {
  tile: TILE,

  /**
   * The most tiles ever drawn - only reached on a ~6000px-wide monitor. How
   * many are ACTUALLY drawn steps up with the viewport in Waves.module.css,
   * which is load-bearing rather than an optimization; see the note there.
   */
  maxTiles: 6,

  /**
   * THE SEA IN PERSPECTIVE, back to front.
   *
   * Distance compresses waves: far off you see a lot of small, fast ripples
   * packed into very little height, and up close a few tall, slow swells. The
   * four layers are built to that rule, and it is where the depth comes from
   * now that they are no longer one shape at four sizes.
   *
   *   far    baseline 70,  ~7px of rise, fine chop        (k = 3, 5, 8)
   *   mid    baseline 99,  ~16px, a mix                   (k = 2, 3, 7)
   *   break  baseline 124, ~28px led by ONE slow swell    (k = 1, 2, 5)
   *   front  baseline 152, ~12px - the shallow wash that meets the page
   *
   * Drift durations ramp with depth too: the far water crawls, the breaking
   * layer travels ~110px every second.
   *
   * ⚠ THE `far` AND `mid` AMPLITUDES ARE CONSTRAINED. Every layer is drawn
   * OPAQUE in a colour pre-mixed over the layer behind it (--wave-*-solid in
   * globals.css), because water you can see through shows you the sea stacks
   * behind it. The near layers ARE allowed to rise clear of what is behind
   * them - a close swell occluding far water is a depth cue worth having, and
   * the colour error where it happens is under 3/255 per channel. But between
   * far and mid that error would be the largest in the chain AND would land on
   * the sea's top edge against the sky, the easiest place to see it. So those
   * two are sized so mid's highest point stays below far's lowest. If you
   * raise mid's amplitudes or move its baseline up, tests/waves.spec.ts will
   * tell you when you have crossed the line.
   *
   * ⚠ THE FRONT LAYER'S FILL IS --waterline-fill, NOT --sand. It makes the
   * waves wash onto whatever is actually behind them: the page background at
   * the top, and - once you scroll down in dark mode - the water you are
   * sinking into. Plain --sand left a dark band between the crest and the sea.
   */
  layers: [
    { fill: "var(--wave-far-solid)",   y: 70,  harmonics: [[3, 5.5, 0.0], [5, 3.4, 2.3], [8, 1.8, 4.1]], sharpen: 0.15, drift: "waveDrift",  driftDur: 26,  swell: "waveSwell2", swellDur: 8,   swellOffset: 0,    crest: 0.3,  bleed: "28px" },
    { fill: "var(--wave-mid-solid)",   y: 99,  harmonics: [[2, 10, 1.4],  [3, 5.5, 3.7], [7, 2.2, 0.5]], sharpen: 0.3,  drift: "waveDrift2", driftDur: 17,  swell: "waveSwell",  swellDur: 6.5, swellOffset: -2.1, crest: 0.55, bleed: "28px" },
    { fill: "var(--wave-break-solid)", y: 124, harmonics: [[1, 15, 2.7],  [2, 8.5, 5.1], [5, 3.4, 1.2]], sharpen: 0.4,  drift: "waveDrift",  driftDur: 11,  swell: "waveSwell2", swellDur: 5,   swellOffset: -1.3, crest: 1,    bleed: "28px" },
    { fill: "var(--waterline-fill)",   y: 152, harmonics: [[1, 7.5, 4.6], [3, 4.2, 1.9], [4, 2.1, 3.0]], sharpen: 0.25, drift: "waveDrift2", driftDur: 8.5, swell: "waveSwell",  swellDur: 4.5, swellOffset: -3.4, crest: 0,    bleed: "28px" },
  ] satisfies WaveLayerSpec[] as WaveLayerSpec[],

  /**
   * The light on a crest: two stacked strokes, a faint wide halo under a
   * stronger core. Both are scaled by the layer's own `crest` value above.
   *
   * ⚠ NEVER REPLACE THIS WITH filter: blur(). That is what it used to be, and
   * on iOS Safari a blur filter inside a layer that animates transform gets
   * re-run as the tiles move; the filtered stroke intermittently blanks and the
   * waves visibly flicker. Two strokes give the same softness for free.
   */
  foam: {
    haloWidth: 5.5,
    haloOpacity: 0.16,
    coreWidth: 2.5,
    coreOpacity: 0.42,
  },
} as const;

/* ══════════════════════════════════════════════════════════════════════════
 *  THE PANEL WATERLINE - the little wave at the foot of each floating panel
 * ══════════════════════════════════════════════════════════════════════════ */

export const WATERLINE = {
  /**
   * ⚠ How tall the water band is. Mirrors --waterline-band in globals.css,
   * which is what reserves the room in the panel's padding - change one and
   * you must change the other, or the crest will overlap the text above it.
   */
  band: 34,

  /**
   * Where the crest sits inside the band, leaving room for the tallest peak.
   * The peak reaches sharpen-boosted (4.6 + 2.7 + 1.5) × 1.25 ≈ 11px above
   * this, so 13 keeps the tallest crest just inside the top of the band.
   */
  baseY: 13,

  /**
   * Fine chop, not ocean swell: this is a little water in a box, so the crest
   * is built from fast harmonics at small amplitude, in the spirit of the
   * hero's `far` layer. ⚠ Whole-number k, as always - see crest.ts.
   */
  harmonics: [
    [4, 4.6, 0.6],
    [7, 2.7, 2.9],
    [11, 1.5, 4.7],
  ] as readonly Harmonic[],

  sharpen: 0.25,

  /** Same two-stroke highlight as the sea, at panel scale. Same ⚠ about blur. */
  foam: {
    haloWidth: 3,
    haloOpacity: 0.18,
    coreWidth: 1.25,
    coreOpacity: 0.45,
  },
} as const;

/* ══════════════════════════════════════════════════════════════════════════
 *  THE NIGHT SKY (dark theme only)
 * ══════════════════════════════════════════════════════════════════════════ */

export const SKY = {
  /**
   * ⚠ Durations are all PRIMES, in seconds, and that is the whole trick. There
   * is no JavaScript in the star field at all - every star is plain HTML with
   * a CSS animation - so the randomness is faked the way a planetarium does
   * it. Two stars at 3s and 5s realign every 15s and the eye catches the
   * pattern; at 3.1 and 5.3 they take minutes. Keep them sharing no common
   * factor and the sky never pulses in unison.
   */
  stars: [
    { top: "12%", left: "18%", size: 2,   dur: 4.3, delay: 0 },
    { top: "20%", left: "34%", size: 1.5, dur: 3.1, delay: 1.4 },
    { top: "9%",  left: "52%", size: 2.5, dur: 5.9, delay: 0.7 },
    { top: "26%", left: "62%", size: 1.5, dur: 3.7, delay: 2.2 },
    { top: "15%", left: "78%", size: 2,   dur: 5.3, delay: 0.3 },
    { top: "30%", left: "88%", size: 1.5, dur: 4.7, delay: 1.9 },
    { top: "22%", left: "8%",  size: 1.5, dur: 6.1, delay: 2.8 },
  ],

  /**
   * Meteors. RARE is the point: each is invisible for all but ~5% of its
   * cycle, so a 47s meteor streaks for a little over two seconds and then
   * leaves you waiting. Two of them, on durations that do not divide into each
   * other, so they never pair up into a rhythm - roughly one every twenty-odd
   * seconds, at unpredictable moments.
   *
   * `travel` is how far it flies along its own angle; `angle` tilts it down
   * and to the right, the way one actually falls.
   */
  meteors: [
    { top: "8%",  left: "12%", len: 110, angle: 24, travel: 300, dur: 29, delay: 6 },
    { top: "18%", left: "58%", len: 90,  angle: 31, travel: 240, dur: 47, delay: 19 },
  ],

  /** How long the whole star field takes to fade when the theme is flipped. */
  fade: "0.25s",
} as const;

/* ══════════════════════════════════════════════════════════════════════════
 *  THE DIVE - how the page sinks as you scroll (dark theme only)
 * ══════════════════════════════════════════════════════════════════════════ */

export const DIVE = {
  /**
   * ⚠ How quickly the water reaches full opacity, as a multiple of --depth.
   * Deliberately fast, and the reason is continuity rather than speed.
   *
   * The water sits BEHIND the hero, and the hero paints its own opaque sky, so
   * while the hero still covers the screen the water filling in is invisible.
   * Reaching full opacity inside that window means that by the time the waves
   * scroll off the top there is already sea behind them, in the wave's own
   * colour. Easing it in slowly - which is what this did first - left a
   * stretch where the near-black page background showed through between the
   * bright teal crest and the water, and that read as the colour jumping at
   * the waterline.
   *
   * The descent itself is carried by the gradient darkening with --depth; this
   * opacity is only here to keep the water out of the light theme.
   */
  waterRamp: 12,

  /**
   * Where the dive begins, as a fraction of a viewport height ABOVE the hero's
   * bottom edge. Starting a little early means you are already sinking as the
   * waves reach the top of the screen, rather than snapping into water after.
   */
  startOffset: 0.6,
} as const;

/* ══════════════════════════════════════════════════════════════════════════
 *  THE LIVE WEATHER the scene follows
 * ══════════════════════════════════════════════════════════════════════════ */

export const WEATHER = {
  /** Newport, Oregon - the stretch of coast the scene is modelled on. */
  lat: 44.63,
  lon: -124.05,

  /** How long before/after the sun crosses the horizon the sky stays warm. */
  goldenWindowMinutes: 40,

  /**
   * Wind → water speed. The scene's --wave-speed is
   * clamp(min, base + windKmh / divisor, max), so every wave duration is
   * divided by it. Clamped at both ends so a dead-calm day still has moving
   * water and a storm does not turn the hero into a washing machine.
   */
  wind: { base: 0.85, divisor: 45, min: 0.85, max: 1.7 },

  /**
   * WMO weather codes that mean "it is raining", as inclusive ranges. 51-67 is
   * drizzle and rain, 80-82 showers, 95-99 thunderstorms.
   * Reference: https://open-meteo.com/en/docs (Weather variable documentation)
   */
  rainCodes: [
    [51, 67],
    [80, 82],
    [95, 99],
  ] as readonly (readonly [number, number])[],
} as const;

/* ══════════════════════════════════════════════════════════════════════════
 *  THE DUCK EASTER EGG - type "duck" anywhere on the page
 * ══════════════════════════════════════════════════════════════════════════ */

export const DUCKS = {
  /** The word that summons them. Lower case; the listener lower-cases input. */
  word: "duck",

  /** How many fall at once. */
  flockSize: 16,

  /**
   * Each duck picks a random value in these ranges, so no two flocks look
   * alike. Written as [min, max]; `left` and `splash` are viewport percentages,
   * `size` is px, and the two durations are seconds.
   */
  left: [3, 94],
  size: [20, 36],
  duration: [3.2, 5.6],
  delay: [0, 1.4],
  /** Where a duck lands and starts bobbing, as a % down the viewport. */
  splash: [64, 82],

  /** How long before the overlay clears - the slowest duck plus its fade. */
  clearAfterMs: 7500,
} as const;

/* ══════════════════════════════════════════════════════════════════════════
 *  RAIN - rendered only when it is actually raining on the Oregon coast
 * ══════════════════════════════════════════════════════════════════════════ */

export const RAIN = {
  /** Degrees off horizontal. 90 would be straight down; 78 is wind-blown. */
  angle: 78,
  /** Gap between streaks, px. Larger = sparser drizzle. */
  gap: 13,
  /** Streak thickness, px. */
  thickness: 1,
  /** Opacity of one streak, before the layer opacity below is applied. */
  streakOpacity: 0.28,
  /** Seconds for one fall loop. Lower = harder rain. */
  fallDur: 0.8,
  /** Opacity of the whole layer. */
  opacity: 0.55,
} as const;
