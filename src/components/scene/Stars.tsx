/**
 * The night sky over the hero - stars that twinkle, and the occasional
 * meteor. Visible ONLY in dark mode. Purely decorative.
 *
 * How the theme switch works with no JavaScript: the whole group's opacity is
 * the --star-opacity token, which globals.css sets to 0 in light and 1 in dark.
 * Flipping the theme just changes the token and the sky fades in or out.
 *
 * There is no JavaScript in here at all, and that is deliberate - this is a
 * server component, so every star and every meteor is plain HTML with a CSS
 * animation. Randomness that would normally want JS is faked the way a
 * planetarium does it: each star gets its own duration and delay, chosen to
 * share no common factor, so they drift out of step and never pulse together.
 */

/**
 * Durations are all primes (in seconds) for that reason - 3s and 5s twinkles
 * realign every 15s, but 3.1 and 5.3 take minutes, which is long enough that
 * the eye never catches the pattern.
 */
const STARS = [
  { top: "12%", left: "18%", size: 2, dur: 4.3, delay: 0 },
  { top: "20%", left: "34%", size: 1.5, dur: 3.1, delay: 1.4 },
  { top: "9%", left: "52%", size: 2.5, dur: 5.9, delay: 0.7 },
  { top: "26%", left: "62%", size: 1.5, dur: 3.7, delay: 2.2 },
  { top: "15%", left: "78%", size: 2, dur: 5.3, delay: 0.3 },
  { top: "30%", left: "88%", size: 1.5, dur: 4.7, delay: 1.9 },
  { top: "22%", left: "8%", size: 1.5, dur: 6.1, delay: 2.8 },
];

/**
 * Meteors. RARE is the point: each one is invisible for all but ~5% of its
 * cycle, so a 47s meteor streaks for a little over two seconds and then leaves
 * you waiting. Two of them, on durations that don't divide into each other, so
 * they never pair up into a predictable rhythm - you get one every twenty-odd
 * seconds on average, at unpredictable moments.
 *
 * `travel` is how far it flies along its own angle; `angle` tilts it down and
 * to the right, the way one actually falls.
 */
const METEORS = [
  { top: "8%", left: "12%", len: 110, angle: 24, travel: 300, dur: 29, delay: 6 },
  { top: "18%", left: "58%", len: 90, angle: 31, travel: 240, dur: 47, delay: 19 },
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
        // The meteors fly beyond their start point; without this they'd streak
        // out over the text and the nav.
        overflow: "hidden",
      }}
    >
      {STARS.map((s, i) => (
        <div
          key={i}
          className="star"
          style={{
            position: "absolute",
            top: s.top,
            left: s.left,
            width: s.size,
            height: s.size,
            borderRadius: "50%",
            background: "var(--star)",
            opacity: 0.8,
            animationDuration: `${s.dur}s`,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}

      {METEORS.map((m, i) => (
        <div
          key={i}
          className="meteor"
          style={
            {
              top: m.top,
              left: m.left,
              width: m.len,
              animationDuration: `${m.dur}s`,
              animationDelay: `${m.delay}s`,
              "--meteor-angle": `${m.angle}deg`,
              "--meteor-travel": `${m.travel}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
