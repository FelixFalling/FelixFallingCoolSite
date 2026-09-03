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
 * WATER.maxTiles is the MAXIMUM number of tiles; how many are actually drawn
 * (and how wide the row is) comes from Waves.module.css, which steps it up with
 * the viewport. That is load-bearing, not an optimization - see the note there.
 *
 * WHERE THE WATER SITS: these rows fill the whole .waves-strip from the
 * bottom up. The front (sand) layer is filled with --sand, the page
 * background, so the sea always looks like it washes onto the page itself.
 *
 * EVERY NUMBER IN THIS COMPONENT LIVES IN tuning.ts - the four layers, their
 * timings, the foam. This file is only the drawing; go there to tune the sea.
 */

import { crestPath, TILE } from "./crest";
import { WATER, type WaveLayerSpec } from "./tuning";
import styles from "./Waves.module.css";

function WaveLayer({ layer }: { layer: WaveLayerSpec }) {
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
        {Array.from({ length: WATER.maxTiles }, (_, i) => (
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
                <path d={crest} fill="none" style={{ stroke: "var(--wave-foam)" }} strokeWidth={WATER.foam.haloWidth * layer.crest} strokeLinecap="round" opacity={WATER.foam.haloOpacity * layer.crest} />
                <path d={crest} fill="none" style={{ stroke: "var(--wave-foam)" }} strokeWidth={WATER.foam.coreWidth * layer.crest} strokeLinecap="round" opacity={WATER.foam.coreOpacity * layer.crest} />
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
      {WATER.layers.map((layer) => (
        <WaveLayer key={layer.fill + layer.y} layer={layer} />
      ))}
    </div>
  );
}
