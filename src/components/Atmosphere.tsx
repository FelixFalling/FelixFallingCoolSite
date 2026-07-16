/**
 * The soft atmospheric layers of the hero coast scene — everything that isn't
 * the water or the rocks. Four small, self-contained pieces, all decorative:
 *
 *   • <Stars/>  — faint stars that appear ONLY in dark mode.
 *   • <Clouds/> — soft clouds drifting slowly across the upper sky.
 *   • <Gulls/>  — a few tiny birds crossing the scene.
 *   • <Fog/>    — thick, rolling fog banked low over the water.
 *
 * Colors come from tokens in globals.css so they recolor with the theme. --mist
 * is stored as a bare "R, G, B" triple so each layer can pick its own alpha with
 * rgba(var(--mist), a). Clouds and Fog also read the mouse-parallax vars --mx/--my
 * (set by HeroScene) and shift a few pixels toward the cursor; the drifting is on
 * the inner elements so the two transforms don't fight.
 */

/* A reusable soft blob: an elliptical radial gradient that fades to nothing. */
function blob(alpha: number): string {
  return `radial-gradient(ellipse at center, rgba(var(--mist), ${alpha}) 0%, rgba(var(--mist), 0) 70%)`;
}

/* ── Stars (dark mode only) ────────────────────────────────────────────────
 * The whole group fades in via --star-opacity, which is 0 in light and 1 in
 * dark — so no JavaScript is needed to know the theme (and no hydration flash). */
const STARS = [
  { top: "12%", left: "18%", size: 2 },
  { top: "20%", left: "34%", size: 1.5 },
  { top: "9%", left: "52%", size: 2.5 },
  { top: "26%", left: "62%", size: 1.5 },
  { top: "15%", left: "78%", size: 2 },
  { top: "30%", left: "88%", size: 1.5 },
  { top: "22%", left: "8%", size: 1.5 },
];

export function Stars() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        opacity: "var(--star-opacity)",
        transition: "opacity 0.25s ease",
        pointerEvents: "none",
      }}
    >
      {STARS.map((s, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: s.top,
            left: s.left,
            width: s.size,
            height: s.size,
            borderRadius: "50%",
            background: "var(--star)",
            opacity: 0.8,
          }}
        />
      ))}
    </div>
  );
}

/* ── Clouds ────────────────────────────────────────────────────────────── */
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

export function Clouds() {
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
            background: blob(c.alpha),
            animation: `cloudDrift ${c.dur}s ease-in-out infinite ${c.reverse ? "reverse" : ""}`,
            willChange: "transform",
          }}
        />
      ))}
    </div>
  );
}

/* ── Gulls ─────────────────────────────────────────────────────────────── */
// The iconic two-hump gull silhouette. Each bird rides a full-width wrapper that
// carries it all the way across the scene.
const GULL_PATH = "M0 7 Q5 2 10 7 Q15 2 20 7";
const GULLS = [
  { top: "11%", size: 26, dur: 58, delay: 0, reverse: false },
  { top: "17%", size: 18, dur: 78, delay: -30, reverse: false },
  { top: "8%", size: 22, dur: 68, delay: -48, reverse: true },
];

export function Gulls() {
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

/* ── Fog ───────────────────────────────────────────────────────────────── */
// Banked low and heavy over the water (thick & moody), thinning toward the top so
// the hero text above stays readable.
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

export function Fog() {
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
            background: blob(f.alpha),
            animation: `mistDrift ${f.dur}s ease-in-out infinite ${f.reverse ? "reverse" : ""}`,
            willChange: "transform, opacity",
          }}
        />
      ))}
    </div>
  );
}
