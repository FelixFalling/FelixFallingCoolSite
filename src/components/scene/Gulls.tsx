/**
 * A few tiny gulls crossing the hero sky. Purely decorative.
 *
 * Each bird is the classic two-hump "m" silhouette drawn as an SVG stroke. The
 * bird sits at the left edge of a full-width wrapper, and the gullDrift keyframe
 * (globals.css) slides that wrapper all the way across the scene and loops.
 * Negative delays start each bird partway through its flight so they don't all
 * take off from the same spot when the page loads.
 */

// The iconic two-hump gull silhouette.
const GULL_PATH = "M0 7 Q5 2 10 7 Q15 2 20 7";

const GULLS = [
  { top: "11%", size: 26, dur: 58, delay: 0, reverse: false },
  { top: "17%", size: 18, dur: 78, delay: -30, reverse: false },
  { top: "8%", size: 22, dur: 68, delay: -48, reverse: true },
];

export default function Gulls() {
  return (
    <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {GULLS.map((g, i) => (
        <div
          key={i}
          className="gull-drift"
          style={{
            position: "absolute",
            top: g.top,
            left: 0,
            width: "100%",
            animation: `gullDrift ${g.dur}s linear infinite ${g.reverse ? "reverse" : ""}`,
            animationDelay: `${g.delay}s`,
            willChange: "transform",
          }}
        >
          <svg width={g.size} height={(g.size * 10) / 20} viewBox="0 0 20 10" style={{ display: "block" }}>
            <path d={GULL_PATH} fill="none" style={{ stroke: "var(--sea-stack)" }} strokeWidth={1.3} strokeLinecap="round" opacity={0.55} />
          </svg>
        </div>
      ))}
    </div>
  );
}
