"use client";

import Stars from "./Stars";
import Shore from "./Shore";
import Waves from "./Waves";
import Rain from "./Rain";
import DuckRain from "./DuckRain";
import { useCoastalWeather } from "./weather";

/**
 * HeroScene - assembles the coastal diorama behind the hero text.
 *
 * Layering, back → front: stars (sky) → sea stacks → waves. Each layer positions
 * itself; this component just stacks them in order (later = painted on top).
 *
 * NO CURSOR PARALLAX. The scene used to track the pointer and shift the sea
 * stacks a few pixels toward it, which was meant to read as depth. It read as
 * the horizon swaying under the mouse instead - the scene moved every time you
 * moved the cursor, on the one part of the page you look at longest. Parallax
 * sells depth when the VIEWPOINT moves; a cursor is not a head, so all it
 * produces is motion the visitor causes but did not ask for, against a fixed
 * frame. That is a standard vestibular trigger, and gating it on
 * prefers-reduced-motion was not enough - most people it affects have never
 * set that flag. The ambient motion that remains (drift, swell, stars) is
 * slow, continuous, and not coupled to anything the visitor does, which is
 * the difference that matters.
 *
 * `"use client"` is still required - useCoastalWeather fetches on the client.
 */
export default function HeroScene() {
  // Live conditions at Newport, OR - wind speeds up the waves, and rain
  // switches the drizzle layer on. Defaults until loaded.
  const weather = useCoastalWeather();

  return (
    <div
      aria-hidden="true"
      style={
        {
          position: "absolute",
          inset: 0,
          zIndex: 1,
          overflow: "hidden",
          pointerEvents: "none",
          // Weather knob the Waves read: durations divide by --wave-speed.
          "--wave-speed": weather.waveSpeed,
          // 0 most of the day, 1 at the coast's real sunrise/sunset. Read by
          // the golden-hour wash below (and nothing else).
          "--golden": weather.golden,
        } as React.CSSProperties
      }
    >
      <Stars />
      <Shore />
      {/* Golden hour: a warm wash that only exists near the coast's actual
          sunrise or sunset (see weather.ts). It sits above the sky and the
          headland but below the water, so the sun catches the rocks and the
          horizon rather than the foam.

          --golden defaults to 0, so before the weather request resolves - and
          forever, if it fails or is blocked - this layer is fully transparent
          and the scene is exactly what it was. It never changes geometry, so
          it cannot shift the layout either. */}
      <div className="golden-hour" aria-hidden="true" />
      {/* The waves live in a fixed-height strip at the bottom so they keep
          their proportions instead of stretching to the full hero height. The
          height comes from the .waves-strip class (globals.css): 190px,
          deepened on desktop so the sea fills a tall viewport. */}
      <div className="waves-strip" style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}>
        <Waves />
      </div>
      {weather.raining && <Rain />}
      <DuckRain />
    </div>
  );
}
