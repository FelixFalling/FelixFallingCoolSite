/**
 * Fish in the sea under the hero. Purely decorative.
 *
 * HOW THEY GET THEIR DEPTH: not with z-index - there isn't one anywhere in
 * this scene. Every wave layer is drawn fully opaque (see the --wave-*-solid
 * note in Waves.tsx), so a fish is simply painted BETWEEN two of them, and the
 * rows in front cover it up. A group sits in the band between the crest it was
 * inserted after and the crest inserted next; swim below that and the water
 * eats you. That band is the whole illusion, so each group's `bottom` is tied
 * to the crest heights in Waves.tsx - if you move a crest there, move the band
 * here to match.
 *
 * SPARSE ON PURPOSE. The user asked for calm water, not an aquarium: four fish
 * total, each travelling four screens' worth of distance per cycle, so any one
 * of them is off-stage for about three quarters of its life. Durations share no
 * common factor for the same reason the stars' don't (see Stars.tsx) - they
 * never fall into a rhythm you can predict. Expect one fish, sometimes two.
 *
 * No JavaScript: server component, plain HTML, CSS animation.
 */

import styles from "./Fish.module.css";

/**
 * Where each band sits. Crest y values in Waves.tsx are on a 0-200 viewBox
 * measured from the top, so y maps to (100 - y/2)% up from the bottom.
 *
 * These are tuned against the crest in FRONT of each band, not the baseline:
 * the layers are sums of sines and swing well above their own y. Mid's baseline
 * is 99 but its crests reach ~83; break's is 124 and reaches ~96. So a fish
 * parked at the mid-point between two baselines would spend most of its life
 * behind the swell in front of it.
 *
 * Sitting each one just ABOVE the mean crest that hides it gives the read we
 * actually want: mostly visible, ducking out of sight whenever a taller wave
 * rolls through. Occlusion is the point - it just shouldn't be the default.
 *
 *   far  → 54% (y 92), hidden by mid's taller crests   (mid swings 83-115)
 *   mid  → 47% (y 106), hidden by break's taller crests (break swings 96-152)
 */
const BANDS = {
  far: { bottom: "54%", color: "var(--fish-far)" },
  mid: { bottom: "47%", color: "var(--fish-mid)" },
} as const;

export type Band = keyof typeof BANDS;

/**
 * from/to are where the swim starts and ends, in viewport widths. A fish that
 * travels 400vw while only 100vw of that is on screen is visible a quarter of
 * the time - that ratio is what makes them rare, so keep the span wide if you
 * ever shorten the durations.
 *
 * Negative `to` means swimming left, and those fish get flipped so they face
 * the way they are going.
 */
interface Fish {
  band: Band;
  scale: number; // multiplies --fish-size
  from: string;
  to: string;
  dur: number; // seconds for one full crossing
  delay: number;
}

const FISH: Fish[] = [
  { band: "far", scale: 0.7, from: "-170vw", to: "230vw", dur: 113, delay: 0 },
  { band: "far", scale: 0.85, from: "190vw", to: "-210vw", dur: 139, delay: 47 },
  { band: "mid", scale: 1, from: "-200vw", to: "200vw", dur: 101, delay: 23 },
  { band: "mid", scale: 1.15, from: "210vw", to: "-190vw", dur: 127, delay: 71 },
];

/** A fish silhouette: body and tail, no eye, no detail - it is a shadow in
 *  water seen through two layers of it. Drawn facing right. */
function FishShape() {
  return (
    <svg
      className={styles.shape}
      viewBox="0 0 40 18"
      preserveAspectRatio="xMidYMid meet"
      // fill via currentColor so the band's token colours both paths at once
      style={{ fill: "currentColor" }}
    >
      <path d="M14 9 C14 3.5, 22 1, 29 3 C35 4.6, 38 7, 39 9 C38 11, 35 13.4, 29 15 C22 17, 14 14.5, 14 9 Z" />
      <path d="M13 9 L1 2.5 C3 6, 3 12, 1 15.5 Z" />
    </svg>
  );
}

export default function FishGroup({ band }: { band: Band }) {
  const { bottom, color } = BANDS[band];

  return (
    <div className={styles.group} aria-hidden="true" data-testid={`fish-${band}`}>
      {FISH.filter((f) => f.band === band).map((f, i) => (
        <div
          key={i}
          className={`fish ${styles.fish}`}
          style={
            {
              bottom,
              color,
              width: `calc(var(--fish-size) * ${f.scale})`,
              animationDuration: `${f.dur}s`,
              animationDelay: `${f.delay}s`,
              "--fish-from": f.from,
              "--fish-to": f.to,
              // Flip the drawing, not the animated element: the transform on
              // the outer div belongs to fishSwim, and a transform list
              // replaces rather than adds to whatever was there before.
              "--fish-facing": f.to.startsWith("-") ? "-1" : "1",
            } as React.CSSProperties
          }
        >
          <FishShape />
        </div>
      ))}
    </div>
  );
}
