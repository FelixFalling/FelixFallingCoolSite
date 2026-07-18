/**
 * A small lighthouse standing on the left crag. Purely decorative.
 *
 * By day it's just a silhouette in the haze. In dark mode the lantern glows
 * and a translucent beam sweeps a slow full circle over the sea — both are
 * gated by the --star-opacity token (0 in light, 1 in dark), the same
 * no-JavaScript theme switch the stars use.
 *
 * The wrapper copies the sea stacks' parallax shift so the lighthouse stays
 * planted on its rock when the scene leans toward the cursor.
 */
export default function Lighthouse() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        left: "15%",
        bottom: 148,
        // Match SeaStacks' parallax so the lighthouse moves with its rock.
        transform: "translate(calc(var(--mx, 0) * 12px), calc(var(--my, 0) * 7px))",
        transition: "transform 0.3s ease-out",
        opacity: 0.65,
        filter: "blur(0.4px)",
      }}
    >
      {/* The rotating beam — a soft light cone pivoting at the lantern. */}
      <div
        className="beam-sweep"
        style={{
          position: "absolute",
          left: 17,
          bottom: 62,
          width: 540,
          height: 44,
          transformOrigin: "0 50%",
          background: "linear-gradient(90deg, rgba(233, 242, 242, 0.30), rgba(233, 242, 242, 0) 82%)",
          clipPath: "polygon(0 46%, 100% 0, 100% 100%, 0 54%)",
          animation: "beamSweep 14s linear infinite",
          opacity: "var(--star-opacity)",
          transition: "opacity 0.25s ease",
          willChange: "transform",
        }}
      />

      {/* The lantern's steady glow (dark mode only). */}
      <div
        style={{
          position: "absolute",
          left: 8,
          bottom: 54,
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(233, 242, 242, 0.85), rgba(233, 242, 242, 0) 70%)",
          opacity: "var(--star-opacity)",
          transition: "opacity 0.25s ease",
        }}
      />

      {/* The lighthouse itself: tower, gallery, lantern room, roof. */}
      <svg width="34" height="86" viewBox="0 0 34 86" style={{ display: "block" }}>
        <g style={{ fill: "var(--sea-stack)" }}>
          <path d="M11 86 L13.5 32 L20.5 32 L23 86 Z" /> {/* tapered tower */}
          <rect x="9" y="28" width="16" height="4" rx="1" /> {/* gallery deck */}
          <rect x="12.5" y="16" width="9" height="12" /> {/* lantern room */}
          <path d="M10.5 16 L17 6 L23.5 16 Z" /> {/* roof */}
        </g>
        {/* The lamp window — glows via --star (near-invisible by day). */}
        <rect x="14" y="18" width="6" height="8" style={{ fill: "var(--star)" }} opacity="var(--star-opacity)" />
      </svg>
    </div>
  );
}
