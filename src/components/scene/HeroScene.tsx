"use client";

import { useEffect, useRef } from "react";
import Stars from "./Stars";
import Shore from "./Shore";
import Waves from "./Waves";
import Rain from "./Rain";
import DuckRain from "./DuckRain";
import { useCoastalWeather } from "./weather";

/**
 * HeroScene - assembles the coastal diorama behind the hero text and, on desktop,
 * makes it react to the mouse.
 *
 * Layering, back → front: stars (sky) → sea stacks → waves. Each layer positions
 * itself; this component just stacks them in order (later = painted on top) and
 * tracks the cursor.
 *
 * The cursor tracking writes the pointer's position onto this element's style as
 * two CSS variables, --mx and --my (each ~ -1..1 from the hero's center). The
 * parallax layers (sea stacks) read those vars in their own CSS and shift a few
 * pixels toward the cursor, which reads as depth. The `"use client"` line is
 * required because we use browser APIs
 * (matchMedia, pointer events); the rest of the scene is plain CSS/SVG.
 *
 * Touch devices and anyone who prefers reduced motion never get the listener -
 * they see the calm, ambient version, which needs no JavaScript at all.
 */
export default function HeroScene() {
  const rootRef = useRef<HTMLDivElement>(null);
  // Live conditions at Newport, OR - wind speeds up the waves, and rain
  // switches the drizzle layer on. Defaults until loaded.
  const weather = useCoastalWeather();

  useEffect(() => {
    const root = rootRef.current;
    const hero = root?.parentElement; // the <header class="hero"> around us
    if (!root || !hero) return;

    // Cursor parallax is a desktop nicety: only for fine pointers, and never when
    // the visitor has asked for reduced motion.
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!finePointer || reducedMotion) return;

    let frame = 0;
    let pending: { x: number; y: number } | null = null;

    // Do the (cheap) math once per animation frame, not per mouse event.
    const apply = () => {
      frame = 0;
      if (!pending) return;
      const rect = hero.getBoundingClientRect();
      const mx = ((pending.x - rect.left) / rect.width) * 2 - 1;
      const my = ((pending.y - rect.top) / rect.height) * 2 - 1;
      root.style.setProperty("--mx", mx.toFixed(3));
      root.style.setProperty("--my", my.toFixed(3));
    };

    const onMove = (e: PointerEvent) => {
      pending = { x: e.clientX, y: e.clientY };
      if (!frame) frame = requestAnimationFrame(apply);
    };
    const onLeave = () => {
      pending = null;
      if (frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
      // Ease the scene back to center when the cursor leaves the hero.
      root.style.setProperty("--mx", "0");
      root.style.setProperty("--my", "0");
    };

    hero.addEventListener("pointermove", onMove);
    hero.addEventListener("pointerleave", onLeave);
    return () => {
      hero.removeEventListener("pointermove", onMove);
      hero.removeEventListener("pointerleave", onLeave);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      ref={rootRef}
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
        } as React.CSSProperties
      }
    >
      <Stars />
      <Shore />
      {/* The waves live in a fixed-height strip at the bottom so they keep
          their proportions instead of stretching to the full hero height.
          The height comes from the .waves-strip class (globals.css): 190px,
          deepened to 240px on desktop so the sea fills a tall viewport. */}
      <div className="waves-strip" style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}>
        <Waves />
      </div>
      {weather.raining && <Rain />}
      <DuckRain />
    </div>
  );
}
