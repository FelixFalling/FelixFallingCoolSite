/**
 * Soft clouds drifting slowly across the upper hero sky. Purely decorative.
 *
 * Each cloud is a blurry oval: a radial gradient in the --mist color that fades
 * to nothing at its edges. The cloudDrift keyframe (globals.css) slides each one
 * gently side to side; `reverse` makes neighbours move in opposite directions so
 * the sky feels alive rather than sliding as one sheet.
 *
 * The whole field also shifts a few pixels toward the cursor — the --mx/--my
 * variables are written by HeroScene's pointer tracking (0 when there is no
 * cursor, e.g. on phones).
 */

/* An elliptical radial gradient that fades to nothing — one soft cloud puff.
   --mist is stored as bare "R, G, B" so we can pick our own alpha here. */
function cloudPuff(alpha: number): string {
  return `radial-gradient(ellipse at center, rgba(var(--mist), ${alpha}) 0%, rgba(var(--mist), 0) 70%)`;
}

interface Cloud {
  top: string;
  left: string;
  w: number;
  h: number;
  alpha: number;
  dur: number; // seconds for one drift loop
  reverse: boolean;
}

const CLOUDS: Cloud[] = [
  { top: "8%", left: "-4%", w: 380, h: 96, alpha: 0.4, dur: 90, reverse: false },
  { top: "18%", left: "44%", w: 300, h: 78, alpha: 0.32, dur: 120, reverse: true },
  { top: "4%", left: "68%", w: 420, h: 108, alpha: 0.36, dur: 105, reverse: false },
  { top: "26%", left: "22%", w: 260, h: 66, alpha: 0.28, dur: 135, reverse: true },
];

export default function Clouds() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        // Parallax: the whole cloud field shifts a little toward the cursor.
        transform: "translate(calc(var(--mx, 0) * 6px), calc(var(--my, 0) * 4px))",
        transition: "transform 0.3s ease-out",
      }}
    >
      {CLOUDS.map((c, i) => (
        <div
          key={i}
          className="cloud-drift"
          style={{
            position: "absolute",
            top: c.top,
            left: c.left,
            width: c.w,
            height: c.h,
            background: cloudPuff(c.alpha),
            animation: `cloudDrift ${c.dur}s ease-in-out infinite ${c.reverse ? "reverse" : ""}`,
            willChange: "transform",
          }}
        />
      ))}
    </div>
  );
}
