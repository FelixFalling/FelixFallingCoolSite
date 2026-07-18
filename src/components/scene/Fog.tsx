/**
 * Thick, rolling fog banked low over the water. Purely decorative — and the
 * moodiest layer of the scene, so it's the one to tune first if the hero ever
 * feels too heavy or too thin.
 *
 * Each bank is a big blurry oval (radial gradient in the --mist color) placed
 * low in the hero — dense over the waves, thinning higher up so the hero text
 * stays readable. The mistDrift keyframe (globals.css) slides each bank sideways
 * while gently pulsing its opacity, which reads as fog rolling in off the sea.
 *
 * To thin the fog: lower the `alpha` values below. To thicken: raise them.
 *
 * The whole layer also shifts toward the cursor more than any other layer —
 * fog is nearest to the viewer, so it moves the most (that's what sells the
 * depth). --mx/--my come from HeroScene's pointer tracking.
 */

/* An elliptical radial gradient that fades to nothing — one bank of fog.
   --mist is stored as bare "R, G, B" so we can pick our own alpha here. */
function fogBank(alpha: number): string {
  return `radial-gradient(ellipse at center, rgba(var(--mist), ${alpha}) 0%, rgba(var(--mist), 0) 70%)`;
}

interface FogBank {
  top: string;
  left: string;
  w: number;
  h: number;
  alpha: number;
  dur: number;
  reverse: boolean;
}

const FOG: FogBank[] = [
  { top: "46%", left: "-10%", w: 720, h: 260, alpha: 0.6, dur: 58, reverse: false },
  { top: "58%", left: "30%", w: 640, h: 230, alpha: 0.7, dur: 46, reverse: true },
  { top: "64%", left: "-6%", w: 560, h: 200, alpha: 0.65, dur: 52, reverse: false },
  { top: "52%", left: "58%", w: 600, h: 220, alpha: 0.55, dur: 64, reverse: true },
  { top: "72%", left: "20%", w: 820, h: 240, alpha: 0.75, dur: 50, reverse: false },
];

export default function Fog() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        overflow: "hidden",
        // Parallax: fog is near and enveloping, so it shifts most toward the cursor.
        transform: "translate(calc(var(--mx, 0) * 16px), calc(var(--my, 0) * 9px))",
        transition: "transform 0.3s ease-out",
      }}
    >
      {FOG.map((f, i) => (
        <div
          key={i}
          className="mist-drift"
          style={{
            position: "absolute",
            top: f.top,
            left: f.left,
            width: f.w,
            height: f.h,
            background: fogBank(f.alpha),
            animation: `mistDrift ${f.dur}s ease-in-out infinite ${f.reverse ? "reverse" : ""}`,
            willChange: "transform, opacity",
          }}
        />
      ))}
    </div>
  );
}
