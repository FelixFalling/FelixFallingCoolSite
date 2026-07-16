/**
 * The Oregon-coast sea stacks: rocks standing in the water just offshore
 * (think Cannon Beach — Haystack Rock and the Needles). Purely decorative.
 *
 * How it works: this is one full-size layer that sits *behind* the waves, so the
 * breaking surf laps around the rocks' bases. Each rock is a small SVG silhouette
 * filled with the --sea-stack token (so it recolors with the theme). Nearer rocks
 * are larger, lower, and more solid; farther ones are smaller, higher on the
 * horizon, fainter, and blurred — that spread is what creates the sense of depth
 * and distance through the fog.
 *
 * Everything is data in ROCKS below — tweak the numbers to rearrange the coast.
 */

// Three hand-drawn rock silhouettes. Each path lives in a 100×100 box with the
// base along the bottom edge, and is stretched (preserveAspectRatio="none") to
// the rock's width×height below — so a tall, narrow box gives a slender needle.
const SHAPES = {
  // A big rounded monolith, the clear landmark.
  monolith:
    "M22 100 L20 52 C20 40 26 30 34 22 C40 16 44 8 52 12 C60 16 64 30 68 44 L74 72 L80 100 Z",
  // A craggy twin-peaked mass.
  crag:
    "M14 100 L18 60 L26 44 L32 54 L40 30 L48 50 L56 34 L64 58 L72 48 L82 100 Z",
  // A slim pointed needle.
  needle: "M34 100 L40 40 L50 14 L58 44 L66 100 Z",
} as const;

interface Rock {
  shape: keyof typeof SHAPES;
  left: number; // % across the scene
  bottom: number; // px up from the waterline (higher = further offshore)
  width: number; // px
  height: number; // px
  opacity: number;
  blur: number; // px — haze increases with distance
}

// Near rocks first (larger, lower, more solid), then the hazier far cluster. The
// `bottom` values sit the bases up in the water — roughly the middle of the wave
// strip — so the rocks stand offshore and the surf breaks around them.
const ROCKS: Rock[] = [
  { shape: "monolith", left: 62, bottom: 96, width: 132, height: 150, opacity: 0.62, blur: 0.4 },
  { shape: "crag", left: 20, bottom: 100, width: 100, height: 100, opacity: 0.5, blur: 0.6 },
  { shape: "needle", left: 78, bottom: 108, width: 44, height: 88, opacity: 0.4, blur: 0.9 },
  { shape: "crag", left: 40, bottom: 116, width: 60, height: 58, opacity: 0.3, blur: 1.2 },
  { shape: "needle", left: 8, bottom: 120, width: 28, height: 56, opacity: 0.26, blur: 1.4 },
];

export default function SeaStacks() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        // Parallax: the rock cluster shifts toward the cursor (less than the fog,
        // since the rocks sit a bit further out). --mx/--my come from HeroScene.
        transform: "translate(calc(var(--mx, 0) * 12px), calc(var(--my, 0) * 7px))",
        transition: "transform 0.3s ease-out",
      }}
    >
      {ROCKS.map((rock, i) => (
        <svg
          key={i}
          viewBox="0 0 100 100"
          width={rock.width}
          height={rock.height}
          preserveAspectRatio="none"
          style={{
            position: "absolute",
            left: `${rock.left}%`,
            bottom: rock.bottom,
            transform: "translateX(-50%)",
            opacity: rock.opacity,
            filter: `blur(${rock.blur}px)`,
          }}
        >
          <path d={SHAPES[rock.shape]} style={{ fill: "var(--sea-stack)" }} />
        </svg>
      ))}
    </div>
  );
}
