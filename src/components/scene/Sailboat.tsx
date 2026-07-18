/**
 * A tiny sailboat crossing the horizon. Purely decorative.
 *
 * Same full-width-wrapper trick as the gulls: the boat sits at the left edge
 * of a strip spanning the whole scene, and the sailAcross keyframe slides the
 * strip so the boat drifts from one side to the other, then loops. The crossing
 * takes ~2.5 minutes — slow enough that noticing it feels like spotting a real
 * boat. An inner element bobs it gently on the swell.
 *
 * It renders BEHIND the sea stacks and waves (see HeroScene order), so it
 * reads as far out on the water.
 */
export default function Sailboat() {
  return (
    <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <div
        className="sail-drift"
        style={{
          position: "absolute",
          bottom: 118, // sitting on the far wave band — out on the horizon
          left: 0,
          width: "100%",
          animation: "sailAcross 150s linear infinite",
          willChange: "transform",
        }}
      >
        <div style={{ animation: "waveSwell 7s ease-in-out infinite" }} className="wave-swell">
          <svg width="38" height="30" viewBox="0 0 38 30" style={{ display: "block", opacity: 0.45 }}>
            <g style={{ fill: "var(--sea-stack)" }}>
              <path d="M17 2 L17 20 L4 20 Z" /> {/* mainsail */}
              <path d="M20 6 L20 20 L30 20 Z" /> {/* jib */}
              <path d="M2 22 L36 22 L30 28 L8 28 Z" /> {/* hull */}
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
}
