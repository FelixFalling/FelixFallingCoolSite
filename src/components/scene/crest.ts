/**
 * The wave-crest generator, shared by everything on the site that draws water.
 *
 * This lives on its own so the hero's sea (scene/Waves.tsx) and the waterline
 * along the bottom of each information panel (ui/Waterline.tsx) are drawn by the
 * SAME maths. That is the point of the file: a second, hand-drawn squiggle for
 * the panels would look right for exactly as long as nobody retuned the sea,
 * and would then quietly drift out of sympathy with it.
 */

/** One full wave period, in px. Fixed so crests never flatten - see TILE's note
 *  in Waves.tsx and the row widths in Waves.module.css, which both depend on it. */
export const TILE = 1200;

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
export type Harmonic = readonly [k: number, a: number, p: number];

/**
 * The two shaping knobs that turn a wave silhouette into an ocean one. Both
 * default to 0, which is the plain sum-of-sines behaviour every caller had
 * before they existed.
 *
 * STEEP is the trochoidal one, and it is the important one. A sum of sines can
 * only ever draw hills: round on top, round in the trough. Real water is a
 * TROCHOID - a narrow peaked crest sitting over a long flat trough - and the
 * way you get there is by displacing points sideways, not by adding more
 * vertical harmonics:
 *
 *   x = u - displacement(u)      <- points bunch at the crest, spread in the trough
 *   y = baseline - height(u)
 *
 * Doing it in x is what keeps the water from looking LUMPY. The obvious
 * alternative - reaching for higher harmonics until the crest comes to a point
 * - cannot work, because any harmonic big enough to sharpen the crest is also
 * big enough to grow its own extra bumps on the slopes either side of it.
 *
 * `steep` is that sideways pull as a fraction of the most the surface can take.
 * The displacement is split across the harmonics in proportion to how much
 * slope each one contributes, which bounds dx/du at 1 - steep: below 1 the
 * surface is guaranteed not to fold over itself, and AT 1 the crest would come
 * to an infinitely sharp cusp. Values up to about 0.6 look like sea; past that
 * it starts to look like bunting.
 *
 * LEAN shears the surface sideways in proportion to its height, so crests tip
 * over the way a real one does as it feels the bottom coming up. Sign it to
 * match the direction the layer drifts. It is clamped below to whatever the
 * remaining slope budget allows, so it can never fold the surface either.
 */
export interface Shape {
  steep?: number; // 0..1, crest sharpening as a fraction of the maximum
  lean?: number; // how far crests tip; negative leans left, positive right
}

/** The crest sampled at evenly spaced x, with the exact dy/dx at each point. */
interface Samples {
  xs: number[];
  ys: number[];
  slopes: number[];
  baseY: number;
}

/**
 * Sample one tile of crest at evenly spaced x.
 *
 * WALKING THE PARAMETER, NOT X. The trochoid is naturally parametric: step
 * evenly along u and the points come out dense at the crests and sparse in the
 * troughs. That is exactly where you want them, because the crest is where the
 * curve bends hardest, and it means sharpening a wave costs no extra samples.
 * Height is a plain sum of sines in u whatever the sharpening is doing, so four
 * samples per cycle stays as accurate as it ever was.
 *
 * The catch is that the tile has to start at exactly x=0 and end at exactly
 * x=1200 - the fill's closing line, the seam test and the panels' cropping all
 * rest on it - and stepping along u lands wherever it lands. So we solve
 * x(u) = 0 once, by Newton, and start from there. Newton converges in a
 * handful of steps because dx/du is bounded away from zero (that is what the
 * steepness cap buys), and it all runs at build time - these are server
 * components in a static export - so it costs the browser nothing.
 *
 * One period on from that starting u, x has advanced by exactly one tile,
 * because x(u + TILE) = x(u) + TILE. So the two ends agree in height AND in
 * slope, and the tiles still meet with no seam.
 */
function sampleCrest(
  baseY: number,
  harmonics: readonly Harmonic[],
  sharpen: number,
  shape: Shape = {},
): Samples {
  const w = (k: number) => (2 * Math.PI * k) / TILE;
  const amp = harmonics.reduce((sum, [, a]) => sum + a, 0);

  const raw = (u: number) =>
    harmonics.reduce((sum, [k, a, p]) => sum + a * Math.sin(w(k) * u + p), 0);
  const rawSlope = (u: number) =>
    harmonics.reduce((sum, [k, a, p]) => sum + a * w(k) * Math.cos(w(k) * u + p), 0);

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
  const coarse = 256;
  let mean = 0;
  for (let i = 0; i < coarse; i++) mean += q * raw((i * TILE) / coarse) ** 2;
  mean /= coarse;

  // Height above the baseline, and its rate of change along the parameter.
  const height = (u: number) => raw(u) + q * raw(u) ** 2 - mean;
  const heightSlope = (u: number) => rawSlope(u) * (1 + 2 * q * raw(u));

  /* The sideways displacement, split across the harmonics BY AMPLITUDE. Each
     one gets `steep * a / amp` of the fold budget, which it spends at its own
     frequency, so its displacement is that share divided by w.

     Splitting by amplitude rather than by slope is the difference between this
     looking like sea and looking like a ribbon. Slope is where the budget
     naturally seems to belong, but slope goes as a*k, so a small fast ripple
     lays claim to as much of it as the long swell underneath it - and the
     swell is the component whose shape you actually read as the wave. Starve
     that one and you get a crest that is technically sharpened and visibly
     is not.

     Either way the parts sum to at most `steep`, so dx/du >= 1 - steep and the
     surface cannot fold over itself. */
  const steep = Math.min(shape.steep ?? 0, 0.85);
  const share = amp > 0 ? steep / amp : 0;
  const disp = (u: number) =>
    harmonics.reduce((sum, [k, a, p]) => sum + ((share * a) / w(k)) * Math.sin(w(k) * u + p), 0);
  const dispSlope = (u: number) =>
    harmonics.reduce((sum, [k, a, p]) => sum + share * a * Math.cos(w(k) * u + p), 0);

  /* Whatever slope budget the sharpening did not spend, the lean may have -
     less a margin, so dx/du stays comfortably positive and Newton stays quick.
     A lean asked for past that is clamped rather than allowed to fold the
     water over itself. */
  let peakSlope = 0;
  for (let i = 0; i < coarse; i++) {
    peakSlope = Math.max(peakSlope, Math.abs(heightSlope((i * TILE) / coarse)));
  }
  const room = peakSlope > 0 ? Math.max(0, 1 - steep - 0.12) / peakSlope : 0;
  const lean = Math.max(-room, Math.min(room, shape.lean ?? 0));

  const xAt = (u: number) => u - disp(u) - lean * height(u);
  const dxAt = (u: number) => 1 - dispSlope(u) - lean * heightSlope(u);

  /** The parameter that lands the curve on x = 0, by Newton from u = 0. */
  let u0 = 0;
  for (let n = 0; n < 8; n++) u0 -= xAt(u0) / dxAt(u0);

  /* Four samples per cycle of the FASTEST harmonic reproduces a sine to about
     1.6% of amplitude once the tangents are exact - under half a pixel at
     these sizes - and every extra sample is bytes in the HTML, up to six times
     over on a wide monitor. */
  const kMax = Math.max(...harmonics.map(([k]) => k));
  const steps = Math.max(16, kMax * 4);

  const xs: number[] = [];
  const ys: number[] = [];
  const slopes: number[] = [];
  for (let i = 0; i <= steps; i++) {
    const u = u0 + (i * TILE) / steps;
    // Pin the ends rather than trusting the arithmetic: the seam and the fill
    // both want these to be exactly 0 and exactly TILE.
    xs.push(i === 0 ? 0 : i === steps ? TILE : xAt(u));
    // SVG y grows DOWNWARD, so a positive height is a crest above the baseline.
    ys.push(baseY - height(u));
    slopes.push(-heightSlope(u) / dxAt(u)); // dy/dx, via the chain rule
  }
  return { xs, ys, slopes, baseY };
}

const r = (n: number) => Number(n.toFixed(1));

/**
 * Samples `from`..`to` as cubic Béziers.
 *
 * Hermite → Bézier: put each control point a third of the way along that end's
 * tangent. Matching the SLOPE at both ends is what lets four samples per cycle
 * reproduce a sine, instead of merely passing through it.
 */
function toCurve({ xs, ys, slopes }: Samples, from: number, to: number): string {
  let d = `M${r(xs[from])} ${r(ys[from])}`;
  for (let i = from; i < to; i++) {
    const h = (xs[i + 1] - xs[i]) / 3;
    d +=
      ` C${r(xs[i] + h)} ${r(ys[i] + slopes[i] * h)}` +
      `,${r(xs[i + 1] - h)} ${r(ys[i + 1] - slopes[i + 1] * h)}` +
      `,${r(xs[i + 1])} ${r(ys[i + 1])}`;
  }
  return d;
}

/** One tile of crest, from x=0 to x=1200, as smooth cubic Béziers. */
export function crestPath(
  baseY: number,
  harmonics: readonly Harmonic[],
  sharpen: number,
  shape?: Shape,
): string {
  const s = sampleCrest(baseY, harmonics, sharpen, shape);
  return toCurve(s, 0, s.xs.length - 1);
}

/**
 * Only the stretches of crest that rise above `reach`, as one multi-part path.
 *
 * This is for white water, and it is gated on height because that is what
 * actually happens out there: the tallest waves in a train break and go white,
 * and the small ones between them do not. Stroking the whole crest line
 * instead gives every wave an identical rim, which stops reading as foam and
 * starts reading as an outline drawn around the layer.
 *
 * `reach` is measured down from the tallest crest toward the baseline: 0 is
 * the very tip, 1 reaches the layer's mean water line, and past 1 it keeps
 * going down the face - which is what the shallow wash at the front wants,
 * since a beach waterline really is foamy along most of its length.
 */
export function crestCaps(
  baseY: number,
  harmonics: readonly Harmonic[],
  sharpen: number,
  shape: Shape,
  reach: number,
): string {
  const s = sampleCrest(baseY, harmonics, sharpen, shape);
  const top = Math.min(...s.ys);
  const cut = top + reach * (baseY - top);

  let d = "";
  let start = -1;
  for (let i = 0; i < s.ys.length; i++) {
    if (s.ys[i] < cut) {
      if (start < 0) start = i;
      continue;
    }
    if (start >= 0 && i - 1 - start >= 1) d += toCurve(s, start, i - 1);
    start = -1;
  }
  if (start >= 0 && s.ys.length - 1 - start >= 1) d += toCurve(s, start, s.ys.length - 1);
  return d;
}
