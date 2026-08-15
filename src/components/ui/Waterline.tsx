/**
 * The waterline along the bottom of an information panel - the thing that makes
 * each panel read as floating rather than as a box with a picture of wood on it.
 *
 * WHY THIS EXISTS AT ALL. The panels used to carry a salvaged-timber texture:
 * plank seams and grain behind the words. It was hard to read, and toning it
 * down to a third of its strength did not fix that, because the problem was
 * never the strength. ANYTHING painted behind body text competes with the text.
 * So all the character moved to the bottom edge, and the field behind every word
 * went back to flat card colour. That is the rule this component exists to obey:
 * it draws in a reserved band at the foot of the panel and never anywhere else.
 *
 * THE CREST IS REAL WATER. It comes from scene/crest.ts, the same generator the
 * hero's sea uses, so retuning the ocean retunes these too.
 *
 * NEVER preserveAspectRatio="none" HERE. That is the trap the hero already fell
 * into and documented (see the top of scene/Waves.tsx): stretching one crest to
 * fit the viewport flattened the wave. Panels run from ~300px project cards to a
 * ~960px About panel, so a scaled viewBox would give every panel its own
 * differently-squashed wave. Instead the SVG is drawn at its true 1200px width
 * and pinned to the left edge: wider than any panel, so each one shows a
 * different stretch of the same sea at its true shape, and the panel's own
 * `overflow: hidden` does the cropping.
 */

import { crestPath, TILE, type Harmonic } from "@/components/scene/crest";

/** How tall the water band is. Mirrors --waterline-band in globals.css, which
 *  is what reserves the room in the panel's padding - keep the two in step. */
const BAND = 34;

/**
 * Fine chop, not ocean swell: this is a little water in a box, so the crest is
 * built from fast harmonics at small amplitude, in the spirit of the hero's
 * `far` layer. Whole-number k, as always - see the note in crest.ts.
 */
const HARMONICS: readonly Harmonic[] = [
  [4, 4.6, 0.6],
  [7, 2.7, 2.9],
  [11, 1.5, 4.7],
];

/** Where the crest sits inside the band, leaving room for the tallest peak.
 *  The peak reaches sharpen-boosted (4.6 + 2.7 + 1.5) x 1.25 ~ 11px above this,
 *  so 13 keeps the tallest crest just inside the top of the band. */
const BASE_Y = 13;

export default function Waterline() {
  const crest = crestPath(BASE_Y, HARMONICS, 0.25);
  const body = `${crest} L${TILE} ${BAND} L0 ${BAND} Z`; // crest, then down to fill

  return (
    <svg
      className="waterline"
      aria-hidden="true"
      width={TILE}
      height={BAND}
      viewBox={`0 0 ${TILE} ${BAND}`}
      /* No preserveAspectRatio override on purpose - see the note above. */
      style={{
        position: "absolute",
        left: 0,
        bottom: 0,
        pointerEvents: "none",
      }}
    >
      <path d={body} style={{ fill: "var(--panel-water)" }} />
      {/* The light on the crest. Two stacked strokes - a faint wide halo under a
          stronger core - rather than filter: blur(), which on iOS Safari
          intermittently blanks when it sits inside a moving layer, and this one
          moves: the panel bobs. Same reason the hero's foam is filter-free. */}
      <path
        d={crest}
        fill="none"
        style={{ stroke: "var(--panel-foam)" }}
        strokeWidth={3}
        strokeLinecap="round"
        opacity={0.18}
      />
      <path
        d={crest}
        fill="none"
        style={{ stroke: "var(--panel-foam)" }}
        strokeWidth={1.25}
        strokeLinecap="round"
        opacity={0.45}
      />
    </svg>
  );
}
