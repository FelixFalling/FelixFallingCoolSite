/**
 * A soft rain layer over the sea - rendered only when it's actually raining
 * on the Oregon coast right now (see weather.ts). Purely decorative.
 *
 * The rain is one element: a repeating diagonal stripe pattern twice the
 * scene's height, slid downward on a fast loop (rainFall in globals.css).
 * Thin translucent streaks in the fog color read as drizzle through mist.
 *
 * How hard it rains is RAIN in tuning.ts.
 */
import { RAIN } from "./tuning";

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
          // One streak every `gap` px, `thickness` px wide - hence the second
          // stop being gap + thickness.
          background:
            `repeating-linear-gradient(${RAIN.angle}deg, transparent 0 ${RAIN.gap}px, ` +
            `rgba(var(--mist), ${RAIN.streakOpacity}) ${RAIN.gap}px ${RAIN.gap + RAIN.thickness}px)`,
          animation: `rainFall ${RAIN.fallDur}s linear infinite`,
          opacity: RAIN.opacity,
          willChange: "transform",
        }}
      />
    </div>
  );
}
