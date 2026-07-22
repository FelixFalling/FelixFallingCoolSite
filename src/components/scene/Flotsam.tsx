/**
 * Flotsam: the small things the sea leaves on the sand. A shell, a strand of
 * kelp, a stick of driftwood, a starfish, a bit of sea glass. Purely
 * decorative, like everything else on this beach.
 *
 * HOW IT WORKS. Each item sits at a fixed spot on the beach and runs one long
 * opacity/nudge cycle (flotsamWash in globals.css): invisible → deposited
 * quickly with a small downward slide, as if a sheet just left it there →
 * sits for most of the cycle → washed away again. The periods are long and
 * deliberately awkward (59s, 83s, 103s...) so no two items keep time with
 * each other or with the swash sheets: sometimes the beach is bare, sometimes
 * two or three things are lying about, and the combination takes hours to
 * repeat. No JavaScript, no randomness - the same trick Swash.tsx documents.
 *
 * EVERYTHING HERE IS PROPORTIONAL, which is the lesson this file learned the
 * hard way. The beach band (--waterline) grows with the viewport - roughly
 * 76px on a phone, 124px on a QHD monitor - and the rocks grow with
 * --shore-scale (0.7 → 1.55). The first version of this file used fixed
 * pixel offsets and fixed sizes, tuned at 1440px: on a wide screen the items
 * drifted up into the wet zone (reading as litter floating in the water) and
 * shrank to specks next to the enlarged rocks. So:
 *
 *   position - `beachFrac`: a fraction of --waterline up from the hero's
 *     bottom edge (0 = bottom, 1 = water's edge). The same fraction lands on
 *     the same-looking sand at every width.
 *   size - each item scales by --shore-scale from its feet, exactly like the
 *     Shore clusters, so shells keep their proportion to the rocks.
 *
 * WHERE ON THE BEACH. The big sheet's furthest run-up lands around frac 0.37
 * of the band, so fracs just under that (~0.3-0.45) put the items right at
 * the wrack line - where a real tide strands things - and the low ones only
 * get wet when the weather is up (--wave-speed > 1 stretches the run).
 *
 * LAYERING. Rendered inside Swash between the sand bands and the water
 * sheets, so a run-up visibly washes OVER the items - which is most of what
 * sells the effect.
 *
 * Reduced motion: `animation: none` falls back to the base opacity below, so
 * a couple of items are simply always there (restOpacity > 0) and the rest
 * stay hidden - a calm beach with a shell or two on it.
 */

interface Item {
  key: string;
  left: string; // % across the scene
  beachFrac: number; // fraction of --waterline up from the hero's bottom edge
  tilt: number; // degrees - things get dumped at an angle, not laid out flat
  period: number; // seconds for one full washed-in → washed-out cycle
  delay: number; // negative starts the item mid-cycle
  restOpacity: number; // reduced-motion fallback: 0 = hidden, >0 = always there
  svg: React.ReactNode;
}

/* The drawings, in muted beach-find colours (globals.css, themed for light
   and dark). Base sizes are tuned for --shore-scale: 1, i.e. they render
   at 0.7x of this on phones and up to 1.55x on a 4K. */
const shell = (
  <svg width="31" height="24" viewBox="0 0 18 14">
    <path d="M9 13 C2 13 0 8 1 4 C3 6 5 7 9 7 C13 7 15 6 17 4 C18 8 16 13 9 13 Z" style={{ fill: "var(--flotsam-shell)" }} />
    <path d="M9 13 L5 5 M9 13 L9 4 M9 13 L13 5" stroke="var(--flotsam-shell-line)" strokeWidth="0.8" fill="none" />
  </svg>
);

const kelp = (
  <svg width="59" height="21" viewBox="0 0 34 12">
    <path
      d="M1 8 C6 4 10 11 15 7 C20 3 24 10 29 6 C31 4 33 5 33 5"
      fill="none"
      style={{ stroke: "var(--flotsam-kelp)" }}
      strokeWidth="2.4"
      strokeLinecap="round"
    />
    <circle cx="10" cy="8" r="1.6" style={{ fill: "var(--flotsam-kelp)" }} />
    <circle cx="24" cy="7" r="1.3" style={{ fill: "var(--flotsam-kelp)" }} />
  </svg>
);

const driftwood = (
  <svg width="52" height="16" viewBox="0 0 30 9">
    <path
      d="M1 6 C6 3 12 5 18 3 C23 1 28 3 29 4 L28 7 C22 6 16 8 10 7 C6 6 3 8 1 6 Z"
      style={{ fill: "var(--flotsam-wood)" }}
    />
  </svg>
);

const starfish = (
  <svg width="28" height="28" viewBox="0 0 16 16">
    <path
      d="M8 0 L10 5.5 L16 6 L11.5 9.5 L13 15 L8 11.8 L3 15 L4.5 9.5 L0 6 L6 5.5 Z"
      style={{ fill: "var(--flotsam-star)" }}
    />
  </svg>
);

const seaglass = (
  <svg width="17" height="16" viewBox="0 0 10 9">
    <path d="M2 1 L8 0 L10 5 L6 9 L0 6 Z" style={{ fill: "var(--flotsam-glass)" }} opacity="0.8" />
  </svg>
);

// Spread across the beach, avoiding ~35-65% where the hero text sits closest,
// and staying clear of the shore clusters' bases. beachFrac keeps everything
// between the big sheet's reach (~0.37) and the sand's fade-out near the
// hero's bottom edge.
const ITEMS: Item[] = [
  { key: "shell-1", left: "22%", beachFrac: 0.41, tilt: -8, period: 59, delay: -14, restOpacity: 0.7, svg: shell },
  { key: "kelp-1", left: "71%", beachFrac: 0.49, tilt: 0, period: 83, delay: -51, restOpacity: 0, svg: kelp },
  { key: "wood-1", left: "31%", beachFrac: 0.29, tilt: 4, period: 103, delay: -37, restOpacity: 0, svg: driftwood },
  { key: "star-1", left: "83%", beachFrac: 0.44, tilt: -12, period: 127, delay: -88, restOpacity: 0.6, svg: starfish },
  { key: "glass-1", left: "12%", beachFrac: 0.46, tilt: 10, period: 71, delay: -9, restOpacity: 0, svg: seaglass },
  { key: "shell-2", left: "90%", beachFrac: 0.32, tilt: 6, period: 97, delay: -60, restOpacity: 0, svg: shell },
];

export default function Flotsam() {
  return (
    <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {ITEMS.map((item) => (
        // Two nested divs because two things want the transform property:
        // the OUTER one belongs to the flotsamWash keyframes (translateY +
        // opacity), the INNER one carries the static centring / tilt /
        // shore-scale. Merge them and the keyframes would silently overwrite
        // the static half.
        <div
          key={item.key}
          className="flotsam-item"
          style={{
            position: "absolute",
            left: item.left,
            bottom: `calc(var(--waterline) * ${item.beachFrac})`,
            // Base opacity doubles as the reduced-motion still (see Swash.tsx
            // for why: `animation: none` falls back to these values).
            opacity: item.restOpacity,
            animation: `flotsamWash ${item.period}s linear ${item.delay}s infinite`,
          }}
        >
          <div
            style={{
              lineHeight: 0, // collapse the inline-SVG baseline gap
              transform: `translateX(-50%) rotate(${item.tilt}deg) scale(var(--shore-scale, 1))`,
              transformOrigin: "50% 100%", // grow from the feet: the sand line stays put
            }}
          >
            {item.svg}
          </div>
        </div>
      ))}
    </div>
  );
}
