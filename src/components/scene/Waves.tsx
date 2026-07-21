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
 * All the animation timing is data below - tweak the numbers to taste.
 */

const TILE = 1200; // px - one wave period; fixed so crests never flatten
const TILES = 6; // covers screens up to ~6000px wide plus one tile of travel

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
}

// Back-to-front: faint far swell → deeper teal → breaking wave with foam → sand.
// Fills are theme tokens (defined in globals.css) so the waves recolor in dark
// mode. The top "sand" layer uses --sand - the page background - so the waves
// always look like they wash onto the page itself, in either theme.
// Drift durations are one full 1200px loop - short enough that the motion is
// unmistakable at a glance (the break layer travels ~110px every second).
const LAYERS: Layer[] = [
  { fill: "var(--wave-far)", y: 70, amps: [18, 12, 22, 14], drift: "waveDrift", driftDur: 26, swell: "waveSwell2", swellDur: 8, opacity: 0.5, foam: false },
  { fill: "var(--wave-mid)", y: 100, amps: [24, 16, 28, 18], drift: "waveDrift2", driftDur: 17, swell: "waveSwell", swellDur: 6.5, opacity: 0.65, foam: false },
  { fill: "var(--wave-break)", y: 124, amps: [20, 26, 16, 24], drift: "waveDrift", driftDur: 11, swell: "waveSwell2", swellDur: 5, opacity: 0.85, foam: true },
  { fill: "var(--sand)", y: 152, amps: [10, 14, 8, 12], drift: "waveDrift2", driftDur: 8.5, swell: "waveSwell", swellDur: 4.5, opacity: 1, foam: false },
];

function WaveLayer({ layer }: { layer: Layer }) {
  const d = wavePath(layer.y, ...layer.amps);
  const openCrest = d.replace(/ L1200 200 L0 200 Z$/, ""); // just the crest line, for foam

  return (
    <div
      className="wave-drift"
      style={{
        position: "absolute",
        left: 0,
        bottom: 0,
        width: TILE * TILES,
        height: "100%",
        // Divided by --wave-speed (live wind data via HeroScene): windier on
        // the real coast means faster water here.
        animation: `${layer.drift} calc(${layer.driftDur}s / var(--wave-speed, 1)) linear infinite`,
        willChange: "transform",
      }}
    >
      <div
        className="wave-swell"
        style={{
          position: "absolute",
          inset: 0,
          animation: `${layer.swell} calc(${layer.swellDur}s / var(--wave-speed, 1)) ease-in-out infinite`,
          willChange: "transform",
        }}
      >
        {Array.from({ length: TILES }, (_, i) => (
          <svg
            key={i}
            viewBox="0 0 1200 200"
            preserveAspectRatio="none"
            // bottom: -28 bleeds each drawing past the hero's bottom edge, so
            // when the swell bobs a layer upward (up to 15px) it can never
            // lift its bottom edge into view and flash the layer behind it.
            // The hero clips the overflow, so the bleed is invisible.
            style={{ position: "absolute", left: i * TILE, bottom: -28, width: TILE, height: "calc(100% + 28px)", display: "block" }}
          >
            {/* fill via style, not the SVG attribute, so the var(--…) resolves */}
            <path d={d} style={{ fill: layer.fill }} opacity={layer.opacity} />
            {layer.foam && (
              // Thin, soft, low-opacity foam - misty spray rather than a bright line.
              <path d={openCrest} fill="none" style={{ stroke: "var(--wave-foam)", filter: "blur(0.6px)" }} strokeWidth={3} strokeLinecap="round" opacity={0.5} />
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
