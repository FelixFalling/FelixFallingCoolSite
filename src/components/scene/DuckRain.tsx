"use client";

import { useEffect, useState } from "react";

import { DUCKS } from "./tuning";

/**
 * 🦆 The rubber duck easter egg.
 *
 * Type "duck" anywhere on the page and a flock of rubber ducks rains down,
 * splashes, bobs on the water, and drifts away. A nod to the Rubber Duckie
 * Terminator project - this site detects ducks too, just less accurately.
 *
 * How it works: a window key listener keeps the last few letters typed;
 * when they spell "duck", it generates a batch of ducks with randomized
 * position, size, and timing, rendered as emoji in a fixed overlay. The
 * duckFall keyframe (globals.css) does the falling and bobbing; each duck's
 * splash height comes in via the --duck-splash CSS variable. The overlay
 * clears itself once the last duck has faded.
 *
 * Visitors who prefer reduced motion get no surprise animation (the egg
 * simply doesn't fire) - and the console hint below is the only clue.
 *
 * The word, the flock size and every random range are in tuning.ts under DUCKS.
 */

interface Duck {
  id: number;
  left: number; // vw
  size: number; // px
  duration: number; // s
  delay: number; // s
  splash: number; // vh - where this duck lands and bobs
}

/** Pick a value inside one of the [min, max] ranges in DUCKS. */
const between = ([min, max]: readonly [number, number]) =>
  min + Math.random() * (max - min);

export default function DuckRain() {
  const [ducks, setDucks] = useState<Duck[]>([]);

  useEffect(() => {
    console.log(`🦆 psst - try typing “${DUCKS.word}” anywhere on this page.`);

    let typed = "";
    let clearTimer: ReturnType<typeof setTimeout> | undefined;

    function spawnFlock() {
      const flock: Duck[] = Array.from({ length: DUCKS.flockSize }, (_, i) => ({
        id: Date.now() + i,
        left: between(DUCKS.left),
        size: between(DUCKS.size),
        duration: between(DUCKS.duration),
        delay: between(DUCKS.delay),
        splash: between(DUCKS.splash),
      }));
      setDucks(flock);
      // Remove the flock after the slowest duck has finished fading.
      clearTimeout(clearTimer);
      clearTimer = setTimeout(() => setDucks([]), DUCKS.clearAfterMs);
    }

    function onKey(event: KeyboardEvent) {
      if (event.key.length !== 1) return; // ignore Shift, arrows, etc.
      typed = (typed + event.key.toLowerCase()).slice(-DUCKS.word.length);
      if (typed !== DUCKS.word) return;
      typed = "";
      // No surprise motion for reduced-motion visitors.
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      spawnFlock();
    }

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearTimeout(clearTimer);
    };
  }, []);

  if (ducks.length === 0) return null;

  return (
    <div
      aria-hidden="true"
      style={{ position: "fixed", inset: 0, zIndex: 10000, pointerEvents: "none", overflow: "hidden" }}
    >
      {ducks.map((duck) => (
        <span
          key={duck.id}
          data-duck
          style={
            {
              position: "absolute",
              top: 0,
              left: `${duck.left}vw`,
              fontSize: duck.size,
              animation: `duckFall ${duck.duration}s ease-in ${duck.delay}s both`,
              "--duck-splash": `${duck.splash}vh`,
            } as React.CSSProperties
          }
        >
          🦆
        </span>
      ))}
    </div>
  );
}
