"use client";

import { useDepth } from "./depth";

/**
 * The water you sink into as you scroll past the hero.
 *
 * This is one fixed, full-viewport layer sitting behind the page content. It
 * is deliberately ONE element and deliberately `position: fixed`: the page is
 * several screens tall, and a layer that scrolled with it would cost the
 * compositor a fresh screenful of pixels for every screen of page. Fixed, it
 * costs exactly one screen no matter how long the site gets - which is what
 * keeps this inside the GPU budget asserted in tests/mobile.spec.ts.
 *
 * All the movement lives in CSS (.deep-sea in globals.css), driven by the
 * --water and --depth custom properties this component's hook publishes.
 * Nothing here re-renders while you scroll.
 */
export default function DeepSea() {
  useDepth();

  return <div className="deep-sea" aria-hidden="true" />;
}
