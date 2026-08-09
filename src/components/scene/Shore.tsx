/**
 * The shoreline: the rocks and the lighthouse, built to survive ANY screen
 * width. Purely decorative.
 *
 * The old version positioned each rock and the lighthouse separately with
 * absolute pixels - on very wide screens they drifted apart and the
 * lighthouse floated in mid-air. The fix: each cluster is ONE SVG, and the
 * lighthouse is DRAWN ON its rock inside the same drawing, so they can never
 * separate. Clusters sit a fixed height above the hero's bottom edge (plus
 * --shore-lift on desktop, where the sea band is deeper) at a percentage
 * across the scene, and size themselves in em from --shore-size. So positions
 * scale and sizes grow smoothly rather than jumping at breakpoints. Nothing
 * stretches.
 *
 *   • Headland (left ~16%): a broad crag with the lighthouse on its summit.
 *     In dark mode the lantern glows and a beam sweeps a slow full circle
 *     (gated by --star-opacity - the same no-JS switch the stars use).
 *   • Monolith (right ~63%): the big Haystack-style dome with a stout
 *     companion stack.
 *   • A small distant stack (~42%) for depth.
 *
 * Both main clusters share the sea stacks' parallax shift.
 */

/* One reusable wrapper: anchors a cluster `bottom` px above the hero's bottom
   edge at `left`%, raised by --shore-lift (globals.css) on desktop, where the
   sea band is deeper.

   These clusters were once hung off a computed --waterline instead, so the
   front wave crossed each rock's foot at every width. It was correct about the
   geometry and wrong about the picture - the rocks read as half-sunk and the
   shoreline disappeared - so they sit back on the water at their original
   offsets.

   `size` scales the whole cluster by setting the font size every part of it is
   drawn in, so the rock, the lighthouse and its beam grow together. That
   replaced a transform scale() driven by stepped breakpoints. */
function Cluster({
  left,
  bottom,
  size = 1,
  children,
  opacity = 0.85,
  blur = 0,
}: {
  left: string;
  bottom: number;
  size?: number;
  children: React.ReactNode;
  opacity?: number;
  blur?: number;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left,
        bottom: `calc(${bottom}px + var(--shore-lift, 0px))`,
        fontSize: `calc(var(--shore-size, 16px) * ${size})`,
        transform:
          "translateX(-50%) translate(calc(var(--mx, 0) * 12px), calc(var(--my, 0) * 7px))",
        transformOrigin: "50% 100%",
        transition: "transform 0.3s ease-out",
        opacity,
        filter: blur ? `blur(${blur}px)` : undefined,
      }}
    >
      {children}
    </div>
  );
}

export default function Shore() {
  return (
    <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {/* ── The headland with the lighthouse ──────────────────────────────
          Kept left of the hero text column and scaled down so the tower's tip
          stays below the text at any screen width. */}
      <Cluster left="9%" bottom={50} size={0.75}>
        {/* The turning light, dark mode only (the wrapper's opacity is the
            theme gate, so the animations inside are free to fade the parts).

            ONE beam, like a single-panel lamp turning in the horizontal
            plane: it stretches out over the sea, swings in and shrinks as the
            lamp turns toward you - and at the moment it points your way the
            beam vanishes and the lantern FLASHES - then it swings back out.
            beamTurn drives the beam's scaleX, lampFlash brightens the lantern
            at the same instant (both 8s, matched in globals.css). */}
        <div style={{ opacity: "var(--star-opacity)", transition: "opacity 0.25s ease" }}>
          {/* The light cone, anchored at the lantern (x=214, y=216 from
              bottom), reaching out over the open sea to the right. */}
          <div
            className="beam-sweep"
            style={{
              position: "absolute",
              left: "13.375em", // 214 of the 360-wide drawing
              bottom: "12.1875em", // 195
              width: "29.375em", // 470
              height: "2.625em", // 42
              transformOrigin: "0 50%",
              background:
                "linear-gradient(90deg, rgba(233, 242, 242, 0.42), rgba(233, 242, 242, 0) 88%)",
              clipPath: "polygon(0 45%, 100% 0, 100% 100%, 0 55%)",
              animation: "beamTurn 8s ease-in-out infinite",
              willChange: "transform, opacity",
            }}
          />
          {/* The lantern glow - flashes brightest as the beam points your way. */}
          <div
            className="lamp-flash"
            style={{
              position: "absolute",
              left: "12.5em", // 200
              bottom: "12.625em", // 202
              width: "1.75em", // 28
              height: "1.75em",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(233, 242, 242, 0.9), rgba(233, 242, 242, 0) 70%)",
              animation: "lampFlash 8s ease-in-out infinite",
            }}
          />
        </div>
        <svg width="22.5em" height="15em" viewBox="0 0 360 240" style={{ display: "block" }}>
          <g style={{ fill: "var(--sea-stack)" }}>
            {/* The crag: broad and heavy, with a flat summit under the tower. */}
            <path
              d={
                "M0 240 L8 172 C28 150 58 156 82 142 C108 122 148 108 176 116" +
                " L180 122 C200 124 244 122 258 128 C292 138 322 158 342 178" +
                " L354 240 Z"
              }
            />
            {/* The lighthouse, drawn on the summit (base y=124 sits on rock). */}
            <path d="M204 124 L208 44 L220 44 L224 124 Z" /> {/* tapered tower */}
            <rect x="200" y="38" width="28" height="6" rx="2" /> {/* gallery */}
            <rect x="206" y="18" width="16" height="20" /> {/* lantern room */}
            <path d="M203 18 L214 6 L225 18 Z" /> {/* roof */}
          </g>
          {/* Lamp window - glows via --star in dark mode. */}
          <rect x="209" y="21" width="10" height="13" style={{ fill: "var(--star)" }} opacity="var(--star-opacity)" />
        </svg>
      </Cluster>

      {/* ── A small distant stack, hazier, for depth ─────────────────────── */}
      <Cluster left="42%" bottom={92} opacity={0.4} blur={1}>
        <svg width="5.625em" height="4.5em" viewBox="0 0 90 72" style={{ display: "block" }}>
          <path
            d="M0 72 L8 34 C18 12 34 8 46 20 C58 30 70 26 80 42 L90 72 Z"
            style={{ fill: "var(--sea-stack)" }}
          />
        </svg>
      </Cluster>

      {/* ── The monolith (Haystack Rock) with a stout companion ──────────── */}
      <Cluster left="63%" bottom={62} opacity={0.8}>
        <svg width="17.5em" height="13.75em" viewBox="0 0 280 220" style={{ display: "block" }}>
          <g style={{ fill: "var(--sea-stack)" }}>
            {/* the big dome */}
            <path d="M14 220 C20 128 42 66 94 38 C122 22 152 22 174 46 C212 82 236 142 248 220 Z" />
            {/* stout companion stack */}
            <path d="M244 220 L250 158 C256 132 270 128 276 148 L280 178 L280 220 Z" />
          </g>
        </svg>
      </Cluster>
    </div>
  );
}
