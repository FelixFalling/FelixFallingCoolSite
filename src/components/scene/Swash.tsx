/**
 * The swash: sheets of water that run up the beach and drain back out.
 * Purely decorative. This is the part that makes the hero feel like standing
 * on a beach rather than looking at a distant sea.
 *
 * ORIENTATION, which is the thing to keep straight while reading this file:
 * the viewer stands at the BOTTOM of the scene, so water running UP the beach
 * moves DOWN the screen. Every "uprush" here is a positive translateY, and the
 * danger zone is the hero's bottom edge, where the drawing gets sliced off.
 *
 * HOW ONE SHEET WORKS. Each is an animated wrapper holding one static SVG
 * whose bottom edge is an irregular "tongue". At rest the tongue sits exactly
 * on --waterline (globals.css derives that from where Waves.tsx draws its
 * front crest), so the swash is always joined to the sea with no gap. The body
 * of the sheet extends back up into the water, where it is never seen.
 *
 * WHY IT LOOKS REAL. Two reasons, both worth preserving if you retune this:
 *
 *   1. The motion is ASYMMETRIC. Water rushes in fast, hangs at the top of its
 *      run, then slides back more slowly. That is the swashRun keyframes in
 *      globals.css, not anything here.
 *   2. The rhythm is IRREGULAR. Three sheets run on periods that do not divide
 *      into each other (7.3s, 11.7s, 23.9s), so their peaks rarely coincide and
 *      the combination takes hours to repeat. The big sheet also fades on a
 *      fourth period (37s), so how FAR it runs and how STRONGLY it reads drift
 *      in and out of phase: every so often the two line up and you get a set
 *      wave. No JavaScript, no random numbers, no loop you can spot.
 *
 * WHY IT DOES NOT TILE, unlike Waves.tsx. These sheets only move vertically,
 * so they never need to be wider than the screen. Tiling them would mean
 * viewport + 1200px per sheet, tripling GPU layer memory in exactly the place
 * Waves.module.css exists to protect. Read the note in that file before
 * changing this. The sheets ARE slightly wider than the viewport (see overhang
 * below) so their tongues get cropped differently and no two share an endpoint
 * at the screen edge.
 *
 * All the tuning is the SHEETS array below.
 */

import Flotsam from "./Flotsam";

/**
 * The tongue: the sheet's irregular leading edge, left to right.
 *
 * Seven points rather than a handful, because this SVG is stretched to the full
 * width of the screen. Broad lobes end up hundreds of pixels wide on a desktop
 * and read as a straight line with a kink in it; finer ones still look like a
 * water's edge. `bump` is how far the curve overshoots between points.
 */
function tongueEdge(d: number[], bump: number): string {
  return (
    `M0 ${d[0]}` +
    ` C 70 ${d[0] - bump}, 130 ${d[1] + bump}, 200 ${d[1]}` +
    ` S 330 ${d[2] - bump}, 400 ${d[2]}` +
    ` S 530 ${d[3] + bump}, 600 ${d[3]}` +
    ` S 730 ${d[4] - bump}, 800 ${d[4]}` +
    ` S 930 ${d[5] + bump}, 1000 ${d[5]}` +
    ` S 1130 ${d[6] - bump}, 1200 ${d[6]}`
  );
}

/** The same edge, closed up over the top into a fillable shape. */
function tongueBody(d: number[], bump: number): string {
  return `${tongueEdge(d, bump)} L1200 0 L0 0 Z`;
}

interface Sheet {
  key: string;
  depths: number[]; // tongue depth in viewBox units (0 = back of the sheet, 200 = front)
  bump: number; // how much the tongue curves between those points
  period: number; // seconds for one full run-up and drain
  delay: number; // negative starts the sheet part-way through its cycle
  reach: number; // fraction of --swash-reach this sheet travels
  overhang: string; // how far it hangs past each screen edge
  restOpacity: number; // what it settles to, and what reduced motion shows
  foam: boolean; // draw a foam edge. Not every sheet gets one, see below.
  fadePeriod?: number; // only the big sheet: the separate "set wave" rhythm
}

// Three overlapping runs of water at different sizes. Periods are deliberately
// awkward numbers so they do not share a common multiple.
//
// About the depths: the SVG is squashed hard vertically (a 200-unit box drawn
// into ~110px), so a tongue needs a big spread in these numbers to read as an
// irregular edge rather than a flat line on screen. Roughly 2 units per visible
// pixel. Keep the deepest point near 195 so that at rest the tongue sits on the
// waterline and the run-up carries it out onto the sand.
// Only the two larger sheets carry a foam edge. A foam line per sheet reads as
// several parallel wavy lines drawn across the water rather than as a beach:
// on a real one you mostly see a single moving edge at a time. The small sheet
// is texture underneath it, not another edge.
const SHEETS: Sheet[] = [
  // Constant small lapping at the water's edge.
  { key: "a", depths: [152, 190, 160, 196, 168, 186, 156], bump: 12, period: 7.3, delay: 0, reach: 0.5, overhang: "0%", restOpacity: 0.45, foam: false },
  // The medium ones.
  { key: "b", depths: [188, 154, 196, 162, 192, 150, 184], bump: 15, period: 11.7, delay: -3.1, reach: 0.75, overhang: "6%", restOpacity: 0.6, foam: true },
  // The occasional big run-up. Two animations on one element, on two different
  // properties. If you add a third, do NOT let it touch transform: the last
  // declaration would silently win and the sheet would stop running.
  { key: "c", depths: [166, 197, 150, 188, 172, 194, 158], bump: 18, period: 23.9, delay: -8.4, reach: 1, overhang: "10%", restOpacity: 0.8, foam: true, fadePeriod: 37 },
];

function SwashSheet({ sheet }: { sheet: Sheet }) {
  const edge = tongueEdge(sheet.depths, sheet.bump);
  const body = tongueBody(sheet.depths, sheet.bump);
  const fillId = `swash-fill-${sheet.key}`;

  // How far this sheet runs, in two parts:
  //   the cap  - never let the leading edge reach the hero's bottom edge,
  //              where the drawing is sliced off. This is a hard safety valve.
  //   the wind - a windier coast pushes the water further up the sand
  //              (--wave-speed is 0.85 to 1.7, live from weather.ts).
  const up =
    `min(calc(var(--waterline) - 22px),` +
    ` calc(var(--swash-reach) * ${sheet.reach} * (0.72 + 0.28 * var(--wave-speed, 1))))`;

  const run = `swashRun calc(${sheet.period}s / var(--wave-speed, 1)) linear ${sheet.delay}s infinite`;
  const fade = sheet.fadePeriod
    ? `, swashFade calc(${sheet.fadePeriod}s / var(--wave-speed, 1)) ease-in-out 0s infinite`
    : "";

  return (
    <div
      className="swash-run"
      style={{
        position: "absolute",
        left: `calc(-1 * ${sheet.overhang})`,
        right: `calc(-1 * ${sheet.overhang})`,
        // At rest the tongue sits on the waterline; the body reaches back up
        // into the sea behind it.
        bottom: "var(--waterline)",
        height: "var(--swash-body)",
        // Base values are the picture reduced motion shows, because
        // `animation: none` falls back to these rather than freezing on 0%.
        opacity: sheet.restOpacity,
        ["--swash-up" as string]: up,
        animation: run + fade,
        willChange: "transform",
        // Same iOS layer pinning as the wave rows - see the note in Waves.tsx.
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
      }}
    >
      <svg
        viewBox="0 0 1200 200"
        preserveAspectRatio="none"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      >
        <defs>
          {/* Most of this sheet is lying over the SEA, where it must not be
              visible at all: paint it there and you get a flat band with a hard
              top edge across the water. So it starts fully transparent at the
              back and only becomes water near the tongue, which is the part
              that actually ends up on the sand.
              userSpaceOnUse (rather than the default bounding box) ties these
              offsets straight to the viewBox, so they stay put no matter how
              the tongue is reshaped. */}
          <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="200" gradientUnits="userSpaceOnUse">
            <stop offset="0" style={{ stopColor: "var(--swash-water)", stopOpacity: 0 }} />
            <stop offset="0.45" style={{ stopColor: "var(--swash-water)", stopOpacity: 0.1 }} />
            <stop offset="0.68" style={{ stopColor: "var(--swash-water)", stopOpacity: 0.26 }} />
            {/* Thickest just behind the edge, then thinning again at the very
                tip, which is a film a few millimetres deep. That also keeps the
                leading edge faint as it approaches the hero's bottom cut.
                Strong enough to show on near-white sand, but no stronger: three
                of these overlap, and if each is too solid they stack up into
                visible slabs of colour instead of water. */}
            <stop offset="0.88" style={{ stopColor: "var(--swash-water)", stopOpacity: 0.52 }} />
            <stop offset="1" style={{ stopColor: "var(--swash-water)", stopOpacity: 0.4 }} />
          </linearGradient>
        </defs>

        <path d={body} fill={`url(#${fillId})`} />

        {/* Foam piles up along the front during the rush and thins as the
            water drains out from under it. Animating opacity only, so this
            costs a repaint and not another GPU layer. */}
        {sheet.foam && (
        <g
          className="swash-foam"
          style={{
            opacity: 0.3,
            animation: `swashFoam calc(${sheet.period}s / var(--wave-speed, 1)) linear ${sheet.delay}s infinite`,
          }}
        >
          {/* Stroke widths are in viewBox units and the box is squashed to
              roughly half height on screen, so these end up about half as thick
              as the numbers suggest. The wide faint ones are spray hanging over
              the edge; the tight one is the foam line itself.
              The spray is a STACK of concentric strokes fading outward, not
              filter: blur(). This group's opacity animates every cycle, and on
              iOS Safari a blur filter inside continuously-animating content
              re-rasterizes per frame and intermittently blanks - which read as
              the waves flickering on phones. Same rule in Waves.tsx.
              Keep these restrained. Three sheets stacked up means three foam
              edges at once, and heavy strokes turn that into a mess of parallel
              wavy lines rather than water. */}
          <path d={edge} fill="none" style={{ stroke: "var(--swash-foam)" }} strokeWidth={22} opacity={0.05} />
          <path d={edge} fill="none" style={{ stroke: "var(--swash-foam)" }} strokeWidth={14} opacity={0.08} />
          <path d={edge} fill="none" style={{ stroke: "var(--swash-foam)" }} strokeWidth={8} strokeLinecap="round" opacity={0.12} />
          <path d={edge} fill="none" style={{ stroke: "var(--swash-foam)" }} strokeWidth={3.5} strokeLinecap="round" opacity={0.9} />
        </g>
        )}
      </svg>
    </div>
  );
}

export default function Swash() {
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }} aria-hidden="true">
      {/* The bare beach: a strip of actual sand for the water to run onto and
          uncover as it drains. Without this the beach is --sand (the page
          background), so there is no visible shore at all.
          It spans from the waterline down to the hero's bottom edge, and it is
          the BACKMOST thing here, so the wet-sand darkening and the water
          sheets both paint over it. The gradient is soft at the waterline (the
          water covers that join) and fades to nothing at the very bottom, where
          the sand has to melt into the page with no hard line. */}
      <div
        className="beach-sand"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: "var(--waterline)",
          background:
            "linear-gradient(to bottom," +
            " rgba(var(--beach-sand), 0.35) 0%," +
            " rgba(var(--beach-sand), 0.92) 24%," +
            " rgba(var(--beach-sand), 0.92) 66%," +
            " rgba(var(--beach-sand), 0) 96%)",
        }}
      />

      {/* Sand the water has just left. It sits over the dry beach and under the
          sheets, scaling down from the waterline so the high-water mark creeps
          up and dries back. The gradient is fully transparent well before the
          hero's bottom edge, keeping the seam into the page invisible. */}
      <div
        className="wet-sand"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: "var(--waterline)",
          transformOrigin: "50% 0",
          // Fades in at the top as well as out at the bottom. Starting at full
          // strength puts a dead-straight horizontal line right across the
          // screen at the waterline, which is glaringly artificial next to all
          // these curved edges.
          background:
            "linear-gradient(to bottom," +
            " rgba(var(--wet-sand), 0) 0%," +
            " rgba(var(--wet-sand), 0.62) 22%," +
            " rgba(var(--wet-sand), 0.45) 52%," +
            " rgba(var(--wet-sand), 0) 88%)",
          // Base values double as the reduced-motion still: a mid-damp band.
          opacity: 0.55,
          transform: "scaleY(0.7)",
          // Trails the big sheet rather than sitting under it, so the sand
          // darkens just after the water has covered it.
          animation: "wetSand calc(23.9s / var(--wave-speed, 1)) ease-in-out -7.2s infinite",
          willChange: "transform, opacity",
          backfaceVisibility: "hidden", // see the note in Waves.tsx
          WebkitBackfaceVisibility: "hidden",
        }}
      />

      {/* What the sea has left on the sand. Over both sand bands, UNDER the
          water sheets, so a run-up visibly washes across a shell. */}
      <Flotsam />

      {SHEETS.map((sheet) => (
        <SwashSheet key={sheet.key} sheet={sheet} />
      ))}
    </div>
  );
}
