/**
 * A soft rain layer over the sea — rendered only when it's actually raining
 * on the Oregon coast right now (see weather.ts). Purely decorative.
 *
 * The rain is one element: a repeating diagonal stripe pattern twice the
 * scene's height, slid downward on a fast loop (rainFall in globals.css).
 * Thin translucent streaks in the fog color read as drizzle through mist.
 */
export default function Rain() {
  return (
    <div aria-hidden="true" style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      <div
        className="rain-fall"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: "-100%",
          height: "200%",
          background:
            "repeating-linear-gradient(78deg, transparent 0 13px, rgba(var(--mist), 0.28) 13px 14px)",
          animation: "rainFall 0.8s linear infinite",
          opacity: 0.55,
          willChange: "transform",
        }}
      />
    </div>
  );
}
