import { test, expect } from "./fixtures";

/**
 * Smoke tests for The Wizard's Tower (the cat game). The game is one big
 * closure, so it exposes a tiny debug hook — window.__tower — with a state
 * snapshot and a jumpTo(meters) teleport. That's what lets us test the boss
 * without climbing 50 meters by hand. Desktop project only to keep CI lean.
 */

type TowerState = {
  gameState: string;
  best: number;
  tier: number;
  stage: number;
  boss: boolean;
  bossHp: number;
  bossDy: number;
  lives: number;
  bingus: boolean;
  skin: string;
};

declare global {
  interface Window {
    __tower: { state: TowerState; jumpTo(m: number): void };
  }
}

test.describe("the Wizard's Tower game", () => {
  test.beforeEach(async ({ isMobile }) => {
    test.skip(isMobile, "desktop only — one platform is enough for the game");
  });

  test("loads and starts with no console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("./ghost-cat.html");
    await page.getByRole("button", { name: "Start climbing" }).click();
    await expect
      .poll(() => page.evaluate(() => window.__tower.state.gameState))
      .toBe("playing");
    expect(errors).toEqual([]);
  });

  test("the wizard appears past 50 meters", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("./ghost-cat.html");
    await page.getByRole("button", { name: "Start climbing" }).click();
    await page.evaluate(() => window.__tower.jumpTo(60));

    // The next frames register the height, raise the tier, and summon him.
    await expect
      .poll(() => page.evaluate(() => window.__tower.state.boss), { timeout: 5000 })
      .toBe(true);
    const state = await page.evaluate(() => window.__tower.state);
    expect(state.tier).toBeGreaterThanOrEqual(1);
    expect(state.bossHp).toBeGreaterThan(0);
    // past 50m the tower has changed into its second stage theme
    expect(state.stage).toBe(1);
    expect(errors).toEqual([]);
  });

  test("the wizard swoops into pounce range", async ({ page }) => {
    // Regression guard for "the boss is impossible to hit": within a few
    // seconds of spawning he must dip close enough to the cat to be pounced
    // (bossDy is his vertical distance in scene units; a jump covers ~250).
    await page.goto("./ghost-cat.html");
    await page.getByRole("button", { name: "Start climbing" }).click();
    await page.evaluate(() => window.__tower.jumpTo(60));
    await expect
      .poll(() => page.evaluate(() => window.__tower.state.boss), { timeout: 5000 })
      .toBe(true);
    await expect
      .poll(() => page.evaluate(() => window.__tower.state.bossDy), {
        timeout: 10_000,
        message: "the boss should swoop within pounce reach",
      })
      .toBeLessThan(120);
  });

  test("he who types the name summons Bingus", async ({ page }) => {
    await page.goto("./ghost-cat.html");
    await expect
      .poll(() => page.evaluate(() => window.__tower.state.bingus))
      .toBe(false);
    await page.keyboard.type("bingus");
    await expect
      .poll(() => page.evaluate(() => window.__tower.state.bingus))
      .toBe(true);
    // typing it again equips him
    await page.keyboard.type("bingus");
    await expect
      .poll(() => page.evaluate(() => window.__tower.state.skin))
      .toBe("Bingus");
  });
});
