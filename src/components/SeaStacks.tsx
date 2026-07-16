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
  // A pointed stack — slimmer than the others, but still broad at the base.
  needle: "M26 100 L36 42 L48 12 L62 40 L74 100 Z",
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
// `bottom` values put the bases down at the shoreline — the waves render in
// front, so the breaking surf laps around each rock's feet. Wide boxes relative
// to their height keep the rocks chunky (Haystack Rock is a mound, not a spire).
const ROCKS: Rock[] = [
  { shape: "monolith", left: 63, bottom: 54, width: 190, height: 165, opacity: 0.7, blur: 0.3 },
  { shape: "crag", left: 17, bottom: 58, width: 160, height: 108, opacity: 0.6, blur: 0.45 },
  { shape: "needle", left: 80, bottom: 68, width: 66, height: 100, opacity: 0.5, blur: 0.7 },
  { shape: "crag", left: 40, bottom: 92, width: 95, height: 64, opacity: 0.35, blur: 1.1 },
  { shape: "needle", left: 5, bottom: 98, width: 46, height: 62, opacity: 0.3, blur: 1.3 },
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
