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
export function crestPath(
  baseY: number,
  harmonics: readonly Harmonic[],
  sharpen: number,
): string {
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
