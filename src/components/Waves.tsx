/**
 * The animated ocean waves under the hero. Purely decorative.
 *
 * How it works: each "layer" is an SVG wave shape drawn twice side by side and
 * placed in a strip that's 200% wide. A CSS animation slides that strip left by
 * 50% forever, so as one copy scrolls off, its twin scrolls in — seamless drift.
 * A second, inner element gently bobs the whole layer up and down ("swell").
 * Layers drift in opposite directions and at different speeds, which is what
 * makes it read as water rather than a sliding image.
 *
 * All the animation timing is data below — tweak the numbers to taste.
 */

/** Build one irregular wave crest as an SVG path string. */
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
  foam: boolean; // draw a white foam line on the crest
}

// Back-to-front: faint far swell → deeper teal → breaking wave with foam → sand.
// Fills are theme tokens (defined in globals.css) so the waves recolor in dark
// mode. The top "sand" layer uses --sand — the page background — so the waves
// always look like they wash onto the page itself, in either theme.
const LAYERS: Layer[] = [
  { fill: "var(--wave-far)", y: 70, amps: [18, 12, 22, 14], drift: "waveDrift", driftDur: 34, swell: "waveSwell2", swellDur: 9, opacity: 0.5, foam: false },
  { fill: "var(--wave-mid)", y: 100, amps: [24, 16, 28, 18], drift: "waveDrift2", driftDur: 22, swell: "waveSwell", swellDur: 7, opacity: 0.65, foam: false },
  { fill: "var(--wave-break)", y: 124, amps: [20, 26, 16, 24], drift: "waveDrift", driftDur: 15, swell: "waveSwell2", swellDur: 5.5, opacity: 0.85, foam: true },
  { fill: "var(--sand)", y: 152, amps: [10, 14, 8, 12], drift: "waveDrift2", driftDur: 11, swell: "waveSwell", swellDur: 4.5, opacity: 1, foam: false },
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
        width: "200%",
        height: "100%",
        animation: `${layer.drift} ${layer.driftDur}s linear infinite`,
        willChange: "transform",
      }}
    >
      <div
        className="wave-swell"
        style={{
          position: "absolute",
          inset: 0,
          animation: `${layer.swell} ${layer.swellDur}s ease-in-out infinite`,
          willChange: "transform",
        }}
      >
        <svg
          viewBox="0 0 2400 200"
          preserveAspectRatio="none"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}
        >
          {/* fill via style, not the SVG attribute, so the var(--…) resolves */}
          <path d={d} style={{ fill: layer.fill }} opacity={layer.opacity} transform="translate(0,0)" />
          <path d={d} style={{ fill: layer.fill }} opacity={layer.opacity} transform="translate(1200,0)" />
          {layer.foam && (
            <>
              <path d={openCrest} fill="none" style={{ stroke: "var(--wave-foam)" }} strokeWidth={5} strokeLinecap="round" opacity={0.7} transform="translate(0,0)" />
              <path d={openCrest} fill="none" style={{ stroke: "var(--wave-foam)" }} strokeWidth={5} strokeLinecap="round" opacity={0.7} transform="translate(1200,0)" />
            </>
          )}
        </svg>
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
