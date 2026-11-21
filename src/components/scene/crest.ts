/**
 * The wave-crest generator, shared by everything on the site that draws water.
 *
 * This lives on its own so the hero's sea (scene/Waves.tsx) and the waterline
 * along the bottom of each information panel (ui/Waterline.tsx) are drawn by the
 * SAME maths. That is the point of the file: a second, hand-drawn squiggle for
 * the panels would look right for exactly as long as nobody retuned the sea,
 * and would then quietly drift out of sympathy with it.
 */

import { TILE } from "./tuning";

/**
 * One full wave period, in px. The value and the reasoning behind it live in
 * tuning.ts with the rest of the dials; it is re-exported here because it is
 * part of this module's contract - every path this file produces is exactly
 * TILE wide, and callers need the number to lay the tiles out.
 */
export { TILE } from "./tuning";

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
 * Build one crest as a sum of sines with Stokes trochoidal peaking and coastal
 * forward wave tilt, emitted as smooth cubic Béziers.
 */
export function crestPath(
  baseY: number,
  harmonics: readonly Harmonic[],
  sharpen: number,
  skew = 0,
): string {
  const kMax = Math.max(...harmonics.map(([k]) => k));
  const steps = Math.max(16, kMax * 4);
  const h = TILE / steps;

  const w = (k: number) => (2 * Math.PI * k) / TILE;
  const amp = harmonics.reduce((sum, [, a]) => sum + a, 0);

  // Stokes 2nd-order harmonic + forward wave tilt (skew).
  // Because 2*k is also a whole number whenever k is a whole number, this tiles
  // with zero seam at x = 0 and x = TILE.
  const raw = (x: number) =>
    harmonics.reduce((sum, [k, a, p]) => {
      const th = w(k) * x + p;
      const primary = a * Math.sin(th);
      const stokesSkew = skew > 0 ? 0.22 * skew * a * Math.cos(2 * th - 0.4) : 0;
      return sum + primary + stokesSkew;
    }, 0);

  const rawSlope = (x: number) =>
    harmonics.reduce((sum, [k, a, p]) => {
      const th = w(k) * x + p;
      const primarySlope = a * w(k) * Math.cos(th);
      const stokesSlope = skew > 0 ? -0.44 * skew * a * w(k) * Math.sin(2 * th - 0.4) : 0;
      return sum + primarySlope + stokesSlope;
    }, 0);

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
    d +=
      ` C${r(x0 + h / 3)} ${r(yAt(x0) + (dyAt(x0) * h) / 3)}` +
      `,${r(x1 - h / 3)} ${r(yAt(x1) - (dyAt(x1) * h) / 3)}` +
      `,${r(x1)} ${r(yAt(x1))}`;
  }
  return d;
}

/**
 * Emits SVG path(s) for the foam that crowns the wave peaks.
 *
 * Unlike an artificial contour line traced across the whole wave (which strokes
 * the troughs and makes waves resemble synthetic vector ribbons), real sea
 * foam forms exclusively near the crests and spills down the forward face of
 * each peak.
 */
export function foamCrestPath(
  baseY: number,
  harmonics: readonly Harmonic[],
  sharpen: number,
  skew = 0,
  thresholdRatio = 0.2,
): string {
  const kMax = Math.max(...harmonics.map(([k]) => k));
  const steps = Math.max(16, kMax * 4);
  const h = TILE / steps;

  const w = (k: number) => (2 * Math.PI * k) / TILE;
  const amp = harmonics.reduce((sum, [, a]) => sum + a, 0);

  const raw = (x: number) =>
    harmonics.reduce((sum, [k, a, p]) => {
      const th = w(k) * x + p;
      const primary = a * Math.sin(th);
      const stokesSkew = skew > 0 ? 0.22 * skew * a * Math.cos(2 * th - 0.4) : 0;
      return sum + primary + stokesSkew;
    }, 0);

  const rawSlope = (x: number) =>
    harmonics.reduce((sum, [k, a, p]) => {
      const th = w(k) * x + p;
      const primarySlope = a * w(k) * Math.cos(th);
      const stokesSlope = skew > 0 ? -0.44 * skew * a * w(k) * Math.sin(2 * th - 0.4) : 0;
      return sum + primarySlope + stokesSlope;
    }, 0);

  const q = amp > 0 ? sharpen / amp : 0;
  let mean = 0;
  for (let i = 0; i < steps; i++) mean += q * raw(i * h) ** 2;
  mean /= steps;

  const yAt = (x: number) => baseY - (raw(x) + q * raw(x) ** 2 - mean);
  const dyAt = (x: number) => -rawSlope(x) * (1 + 2 * q * raw(x));
  const r = (n: number) => Number(n.toFixed(1));

  const elevations = [];
  for (let i = 0; i <= steps; i++) elevations.push(baseY - yAt(i * h));
  const maxElev = Math.max(...elevations);
  if (maxElev <= 1) return "";

  const threshold = thresholdRatio * maxElev;
  let foam = "";
  let inCrest = false;

  for (let i = 0; i < steps; i++) {
    const midElev = (elevations[i] + elevations[i + 1]) / 2;
    if (midElev >= threshold) {
      const x0 = i * h;
      const x1 = x0 + h;
      if (!inCrest) {
        inCrest = true;
        foam += ` M${r(x0)} ${r(yAt(x0))}`;
      }
      foam +=
        ` C${r(x0 + h / 3)} ${r(yAt(x0) + (dyAt(x0) * h) / 3)}` +
        `,${r(x1 - h / 3)} ${r(yAt(x1) - (dyAt(x1) * h) / 3)}` +
        `,${r(x1)} ${r(yAt(x1))}`;
    } else {
      inCrest = false;
    }
  }

  return foam.trim();
}
