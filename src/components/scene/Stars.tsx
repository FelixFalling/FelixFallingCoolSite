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
 *
 * The stars and meteors themselves are data in scene/tuning.ts, under SKY.
 */

import { SKY } from "./tuning";

export default function Stars() {
  return (
    <div
      aria-hidden="true"
      data-testid="stars"
      style={{
        position: "absolute",
        inset: 0,
        opacity: "var(--star-opacity)",
        transition: `opacity ${SKY.fade} ease`,
        pointerEvents: "none",
        // The meteors fly beyond their start point; without this they'd streak
        // out over the text and the nav.
        overflow: "hidden",
      }}
    >
      {SKY.stars.map((s, i) => (
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

      {SKY.meteors.map((m, i) => (
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
