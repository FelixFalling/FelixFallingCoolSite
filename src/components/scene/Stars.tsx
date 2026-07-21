/**
 * Faint stars in the hero sky - visible ONLY in dark mode. Purely decorative.
 *
 * How the theme switch works with no JavaScript: the whole group's opacity is
 * the --star-opacity token, which globals.css sets to 0 in light and 1 in dark.
 * Flipping the theme just changes the token and the stars fade in or out.
 *
 * Each star is a tiny dot positioned by the STARS data below - add or move
 * entries to redraw the night sky.
 */

const STARS = [
  { top: "12%", left: "18%", size: 2 },
  { top: "20%", left: "34%", size: 1.5 },
  { top: "9%", left: "52%", size: 2.5 },
  { top: "26%", left: "62%", size: 1.5 },
  { top: "15%", left: "78%", size: 2 },
  { top: "30%", left: "88%", size: 1.5 },
  { top: "22%", left: "8%", size: 1.5 },
];

export default function Stars() {
  return (
    <div
      aria-hidden="true"
      data-testid="stars"
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
