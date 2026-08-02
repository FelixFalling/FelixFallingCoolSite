"use client";

import { useEffect, useState } from "react";

/**
 * Live coastal weather for the hero scene.
 *
 * On page load this asks Open-Meteo (a free, no-API-key weather service) for
 * the CURRENT conditions at Newport, on the real Oregon coast - and the scene
 * quietly matches them:
 *
 *   • wind → the waves (and their swell) speed up
 *   • rain → a rain layer appears over the water
 *   • sunrise/sunset → the sky warms at the coast's real golden hour
 *
 * So the site's weather is the coast's actual weather right now. If the
 * request fails (offline, ad-blocker, API down) everything just keeps the
 * defaults - the scene never depends on the network.
 */

// Newport, Oregon - the stretch of coast the scene is modeled on.
const LAT = 44.63;
const LON = -124.05;
// `timezone=auto` matters: it makes every time in the response - including
// `current.time` - come back in the COAST's local clock, so the sunrise and
// sunset times can be compared against "now there" without any timezone maths.
const API =
  `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}` +
  `&current=weather_code,wind_speed_10m,cloud_cover&wind_speed_unit=kmh` +
  `&daily=sunrise,sunset&timezone=auto`;

export interface CoastalWeather {
  waveSpeed: number; // 1 = normal; higher = windier, faster water
  raining: boolean;
  /**
   * How close it is to sunrise or sunset ON THAT COAST: 0 most of the day,
   * ramping to 1 at the moment the sun crosses the horizon. Drives the warm
   * wash over the scene - see HeroScene.
   */
  golden: number;
}

const DEFAULTS: CoastalWeather = { waveSpeed: 1, raining: false, golden: 0 };

/** How long before/after the sun crosses the horizon the sky stays warm. */
const GOLDEN_WINDOW_MINUTES = 40;

/**
 * Minutes since midnight for an Open-Meteo local time string
 * ("2026-08-01T19:42"), or null if it isn't one.
 *
 * Deliberately string parsing rather than `new Date()`: these timestamps have
 * no zone suffix, so Date would read them in the VISITOR's timezone. Someone
 * loading the page from Tokyo would then be compared against their own clock
 * and get the wrong phase entirely. Every value here comes from the same
 * response in the same (coastal) frame, so plain arithmetic on them is right.
 */
function minutesOfDay(localTime: string | undefined): number | null {
  const match = /T(\d{2}):(\d{2})/.exec(localTime ?? "");
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

/**
 * 1 when `now` sits exactly on sunrise or sunset, falling linearly to 0 once
 * it's GOLDEN_WINDOW_MINUTES away from whichever is nearer.
 */
function goldenAmount(now: number | null, sunrise: number | null, sunset: number | null): number {
  if (now === null) return 0;
  const gaps = [sunrise, sunset]
    .filter((t): t is number => t !== null)
    .map((t) => Math.abs(now - t));
  if (gaps.length === 0) return 0;
  const nearest = Math.min(...gaps);
  return Math.max(0, 1 - nearest / GOLDEN_WINDOW_MINUTES);
}

/** Translate a WMO weather code + wind into scene settings. */
function interpret(code: number, windKmh: number, golden: number): CoastalWeather {
  // Any drizzle/rain/shower/thunder code turns the rain layer on.
  const raining =
    (code >= 51 && code <= 67) || (code >= 80 && code <= 82) || (code >= 95 && code <= 99);

  // Wind speeds up the water - clamped so the scene stays calm-ish.
  const waveSpeed = Math.min(1.7, Math.max(0.85, 0.85 + windKmh / 45));

  return { waveSpeed, raining, golden };
}

/** React hook: returns the current coastal weather (defaults until loaded). */
export function useCoastalWeather(): CoastalWeather {
  const [weather, setWeather] = useState<CoastalWeather>(DEFAULTS);

  useEffect(() => {
    let cancelled = false;
    fetch(API)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const current = data?.current;
        if (cancelled || !current || typeof current.weather_code !== "number") return;
        // The daily arrays are today-first. If they're missing for any reason
        // the golden term is simply 0 and the scene looks exactly as before.
        const golden = goldenAmount(
          minutesOfDay(current.time),
          minutesOfDay(data?.daily?.sunrise?.[0]),
          minutesOfDay(data?.daily?.sunset?.[0]),
        );
        setWeather(interpret(current.weather_code, current.wind_speed_10m ?? 0, golden));
      })
      .catch(() => {
        /* offline / blocked - keep the defaults, no error surfaced */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return weather;
}
