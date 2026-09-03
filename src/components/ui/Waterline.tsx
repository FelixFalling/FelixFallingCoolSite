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
 *
 * The band height, the crest's harmonics and the foam strokes are all in
 * scene/tuning.ts under WATERLINE.
 */

import { crestPath, TILE } from "@/components/scene/crest";
import { WATERLINE } from "@/components/scene/tuning";

export default function Waterline() {
  const { band, baseY, harmonics, sharpen, foam } = WATERLINE;
  const crest = crestPath(baseY, harmonics, sharpen);
  const body = `${crest} L${TILE} ${band} L0 ${band} Z`; // crest, then down to fill

  return (
    <svg
      className="waterline"
      aria-hidden="true"
      width={TILE}
      height={band}
      viewBox={`0 0 ${TILE} ${band}`}
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
        strokeWidth={foam.haloWidth}
        strokeLinecap="round"
        opacity={foam.haloOpacity}
      />
      <path
        d={crest}
        fill="none"
        style={{ stroke: "var(--panel-foam)" }}
        strokeWidth={foam.coreWidth}
        strokeLinecap="round"
        opacity={foam.coreOpacity}
      />
    </svg>
  );
}
