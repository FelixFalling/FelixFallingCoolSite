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
  boss: boolean;
  bossHp: number;
  lives: number;
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
    expect(errors).toEqual([]);
  });
});
