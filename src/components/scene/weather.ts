"use client";

import { useEffect, useState } from "react";

/**
 * Live coastal weather for the hero scene.
 *
 * On page load this asks Open-Meteo (a free, no-API-key weather service) for
 * the CURRENT conditions at Newport, on the real Oregon coast — and the scene
 * quietly matches them:
 *
 *   • wind → the waves (and their swell) speed up
 *   • rain → a rain layer appears over the water
 *
 * So the site's weather is the coast's actual weather right now. If the
 * request fails (offline, ad-blocker, API down) everything just keeps the
 * defaults — the scene never depends on the network.
 */

// Newport, Oregon — the stretch of coast the scene is modeled on.
const LAT = 44.63;
const LON = -124.05;
const API =
  `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}` +
  `&current=weather_code,wind_speed_10m,cloud_cover&wind_speed_unit=kmh`;

export interface CoastalWeather {
  waveSpeed: number; // 1 = normal; higher = windier, faster water
  raining: boolean;
}

const DEFAULTS: CoastalWeather = { waveSpeed: 1, raining: false };

/** Translate a WMO weather code + wind into scene settings. */
function interpret(code: number, windKmh: number): CoastalWeather {
  // Any drizzle/rain/shower/thunder code turns the rain layer on.
  const raining =
    (code >= 51 && code <= 67) || (code >= 80 && code <= 82) || (code >= 95 && code <= 99);

  // Wind speeds up the water — clamped so the scene stays calm-ish.
  const waveSpeed = Math.min(1.7, Math.max(0.85, 0.85 + windKmh / 45));

  return { waveSpeed, raining };
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
        setWeather(interpret(current.weather_code, current.wind_speed_10m ?? 0));
      })
      .catch(() => {
        /* offline / blocked — keep the defaults, no error surfaced */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return weather;
}
