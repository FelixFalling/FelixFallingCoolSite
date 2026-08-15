import { test, expect } from "./fixtures";
import type { Page } from "@playwright/test";

/**
 * The hero scene's live-weather behaviour - specifically the golden hour wash
 * that appears at the coast's REAL sunrise and sunset (see scene/weather.ts).
 *
 * Every test here fakes the Open-Meteo response instead of calling it, for the
 * obvious reason: the real one returns whatever time it happens to be in
 * Oregon, so a test written against it would pass or fail depending on the
 * hour it ran. Faking it also means these tests never touch the network.
 *
 * The route pattern mirrors the contribution-chart test in navigation.spec.ts,
 * which aborts a third-party request the same way.
 */

/** A response shaped like Open-Meteo's, with the times we want to test. */
function forecast(currentTime: string, sunrise: string, sunset: string) {
  return JSON.stringify({
    current: {
      time: currentTime,
      weather_code: 3, // overcast: no rain layer, keeps the test about light
      wind_speed_10m: 10,
      cloud_cover: 80,
    },
    daily: { sunrise: [sunrise], sunset: [sunset] },
  });
}

/** Serve a fixed forecast for the whole page load. */
async function withForecast(page: Page, body: string) {
  await page.route("**open-meteo**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body }),
  );
}

/** The --golden custom property the scene root is carrying, as a number. */
async function goldenValue(page: Page): Promise<number> {
  const raw = await page
    .locator(".golden-hour")
    .evaluate((el) => getComputedStyle(el.parentElement!).getPropertyValue("--golden"));
  return Number(raw.trim() || "0");
}

test.describe("golden hour", () => {
  test("warms the scene near the coast's real sunset", async ({ homePage, page }) => {
    // 19:30 against a 19:42 sunset: 12 minutes out, well inside the 40-minute
    // window, so this should be a strong but not maximum value.
    await withForecast(page, forecast("2026-08-01T19:30", "2026-08-01T06:05", "2026-08-01T19:42"));
    await homePage.goto();

    await expect.poll(() => goldenValue(page)).toBeGreaterThan(0.5);
    await expect(page.locator(".golden-hour")).toBeAttached();
  });

  test("warms it at sunrise too, not just sunset", async ({ homePage, page }) => {
    await withForecast(page, forecast("2026-08-01T06:20", "2026-08-01T06:05", "2026-08-01T19:42"));
    await homePage.goto();

    await expect.poll(() => goldenValue(page)).toBeGreaterThan(0);
  });

  test("leaves the middle of the day alone", async ({ homePage, page }) => {
    // 13:00 is hours from either end - the scene should look exactly as it
    // does with no weather data at all.
    await withForecast(page, forecast("2026-08-01T13:00", "2026-08-01T06:05", "2026-08-01T19:42"));
    await homePage.goto();

    await expect.poll(() => goldenValue(page)).toBe(0);
    await expect(page.locator(".golden-hour")).toHaveCSS("opacity", "0");
  });

  test("the wash is light-mode only", async ({ homePage, page }) => {
    /*
     * A warm `screen` blend is a fair description of low sun on an overcast
     * coast and a poor one of a night sky - in dark mode it lifted the horizon
     * into a muddy orange band that read as a rendering fault. So it is off
     * there, and --golden-strength is the one number that does it.
     *
     * Note --golden itself still moves in dark mode: the weather layer is
     * unchanged and knows nothing about themes. Only the wash's strength is
     * themed, which is why this asserts on the rendered opacity rather than on
     * the value.
     */
    await withForecast(page, forecast("2026-08-01T19:30", "2026-08-01T06:05", "2026-08-01T19:42"));

    await homePage.goto("./", "dark");
    await expect.poll(() => goldenValue(page)).toBeGreaterThan(0.5); // the sun is setting
    await expect(page.locator(".golden-hour")).toHaveCSS("opacity", "0"); // and nothing shows

    await homePage.goto("./", "light");
    await expect
      .poll(async () =>
        Number(await page.locator(".golden-hour").evaluate((el) => getComputedStyle(el).opacity)),
      )
      .toBeGreaterThan(0);
  });

  test("the scene survives the weather request failing", async ({ homePage, page }) => {
    // The important one. Offline, ad-blocked, or Open-Meteo down: the hero
    // must still render and simply keep its defaults - no error, no gap.
    await page.route("**open-meteo**", (route) => route.abort());
    await homePage.goto();

    await expect(homePage.heroName).toBeVisible();
    await expect.poll(() => goldenValue(page)).toBe(0);
    await expect(page.locator(".golden-hour")).toHaveCSS("opacity", "0");
  });

});

/*
 * The times Open-Meteo returns carry no timezone suffix, so parsing them with
 * `new Date()` would read them in the VISITOR's zone - and a visitor in Tokyo
 * would get a completely different phase from one in Oregon. This block runs
 * the browser sixteen hours off the coast; if the code ever regresses to
 * trusting the local clock, it shows up here. Only the relationship between
 * current.time and sunset WITHIN the response should matter.
 *
 * timezoneId is a browser-context option, so it has to be set with test.use in
 * its own describe rather than on an existing page.
 */
test.describe("golden hour, seen from the other side of the world", () => {
  test.use({ timezoneId: "Asia/Tokyo" });

  test("a visitor's own timezone doesn't change what they see", async ({ homePage, page }) => {
    await withForecast(page, forecast("2026-08-01T19:35", "2026-08-01T06:05", "2026-08-01T19:42"));
    await homePage.goto();

    await expect.poll(() => goldenValue(page)).toBeGreaterThan(0.5);
  });
});
