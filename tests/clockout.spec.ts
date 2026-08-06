import { test, expect } from "./fixtures";
import type { Page } from "@playwright/test";

/**
 * The clock-out calculator (public/clockout.html).
 *
 * Two inputs - the time you came back from lunch, and the decimal hours the
 * timeclock already shows - and one answer. The arithmetic is the whole
 * product, so most of this file asserts on the maths directly rather than
 * through the DOM.
 *
 * The two ways this goes wrong are both easy to write and invisible until
 * someone leaves a minute early, so each has its own test below.
 */

declare global {
  interface Window {
    __clockout: {
      computeClockOut(
        backInMin: number,
        hoursWorked: number,
        targetHours: number,
      ): { remainingMins: number; workedMins: number; clockOutMin: number };
      toMinutes(value: string): number | null;
      fmt12(totalMins: number): string;
      fmtDur(mins: number): string;
    };
  }
}

/** Run the page's own maths and format the answer, as the UI does. */
async function clockOut(page: Page, backIn: string, worked: number, target = 8) {
  return page.evaluate(
    ([time, hours, targetHours]) => {
      const api = window.__clockout;
      const backInMin = api.toMinutes(time as string)!;
      const result = api.computeClockOut(backInMin, hours as number, targetHours as number);
      return {
        at: api.fmt12(result.clockOutMin),
        remaining: api.fmtDur(result.remainingMins),
        worked: api.fmtDur(result.workedMins),
        remainingMins: result.remainingMins,
      };
    },
    [backIn, worked, target] as const,
  );
}

test.describe("clock-out calculator", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("./clockout.html");
  });

  test("the worked example", async ({ page }) => {
    // Back at 12:25 PM with 4.02 hr on the clock, against a target of 8.
    const result = await clockOut(page, "12:25", 4.02);

    expect(result.at).toBe("4:24 PM");
    expect(result.remaining).toBe("3h 59m");
    expect(result.worked).toBe("4h 1m");
  });

  test("rounds to the nearest minute rather than truncating", async ({ page }) => {
    /*
     * The gotcha that produces an answer a minute early, and the reason this
     * is not written with a duration formatter: 8 − 4.02 = 3.98 hr = 238.8
     * minutes. Truncating gives 238 and 4:23 PM. Only rounding gives 4:24 PM.
     */
    const result = await clockOut(page, "12:25", 4.02);
    expect(result.remainingMins).toBe(239);
    expect(result.at, "truncated instead of rounding - a minute early").not.toBe("4:23 PM");
  });

  test("treats the decimal as a fraction of an hour, not as minutes", async ({ page }) => {
    /*
     * .5 hr is 30 minutes, not 5. A calculator that reads the decimal part as
     * minutes is wrong by up to 36 minutes, and 4.50 is where that is most
     * obvious: 3.5 hr remaining is 3h 30m, so 12:00 + 3h30m = 3:30 PM. Reading
     * "4.50" as 4h 50m would leave 3h 10m and answer 3:10 PM.
     */
    const result = await clockOut(page, "12:00", 4.5);
    expect(result.at).toBe("3:30 PM");
    expect(result.remaining).toBe("3h 30m");

    // And .02 really is 1.2 minutes, so it rounds down to 1 - not to 2.
    expect(await page.evaluate(() => window.__clockout.fmtDur(Math.round(0.02 * 60)))).toBe("1m");
  });

  test("halves of the working line always add up to the target", async ({ page }) => {
    /*
     * The line under the answer reads "<worked> · <remaining>", and it is
     * there to be checked at a glance - so it must never show a total that
     * isn't the target. Rounding the two halves independently can disagree by
     * a minute when either lands on a .5, which is why worked is derived by
     * subtraction. Swept across a whole range of awkward decimals.
     */
    const mismatches = await page.evaluate(() => {
      const bad: string[] = [];
      for (let hundredths = 0; hundredths <= 800; hundredths++) {
        const worked = hundredths / 100;
        const r = window.__clockout.computeClockOut(0, worked, 8);
        if (r.workedMins + r.remainingMins !== 480) {
          bad.push(`${worked}: ${r.workedMins} + ${r.remainingMins}`);
        }
      }
      return bad;
    });
    expect(mismatches).toEqual([]);
  });

  test("a weekly target is the same sum with a different number", async ({ page }) => {
    // 36.75 hr into a 40-hour week, back at 1:00 PM: 3.25 hr = 3h 15m left.
    const result = await clockOut(page, "13:00", 36.75, 40);
    expect(result.at).toBe("4:15 PM");
    expect(result.remaining).toBe("3h 15m");

    // And an 80-hour period behaves identically.
    expect((await clockOut(page, "13:00", 76.75, 80)).at).toBe("4:15 PM");
  });

  test("says so when the target is already met", async ({ page }) => {
    await page.getByLabel("Back in from lunch").fill("12:25");
    await page.getByLabel(/Hours worked/).fill("8.5");

    await expect(page.locator("#work")).toContainText("Target already met");
    await expect(page.locator("#work")).toContainText("30m over");
  });

  test("a late shift crossing midnight still reads sensibly", async ({ page }) => {
    // Back at 9:30 PM with 2 hr done: 6 hr left lands at 3:30 AM, not 27:30.
    const result = await clockOut(page, "21:30", 2);
    expect(result.at).toBe("3:30 AM");
  });

  test("the page works through its inputs, not just its maths", async ({ page }) => {
    await page.getByLabel("Back in from lunch").fill("12:25");
    await page.getByLabel(/Hours worked/).fill("4.02");

    await expect(page.locator("#out")).toHaveText("4:24 PM");
    await expect(page.locator("#work")).toHaveText("4.02 hr worked (4h 1m) · 3h 59m remaining");
  });

  test("the weekly toggle reveals its target field", async ({ page }) => {
    await expect(page.locator("#targetField")).toBeHidden();
    await page.getByText("Weekly target").click();
    await expect(page.locator("#targetField")).toBeVisible();

    await page.getByLabel(/Target for the period/).fill("24");
    await page.getByLabel("Back in from lunch").fill("12:00");
    await page.getByLabel(/Hours worked/).fill("20");
    await expect(page.locator("#out")).toHaveText("4:00 PM");
  });

  test("shows nothing until it has both inputs", async ({ page }) => {
    await expect(page.locator("#out")).toHaveText("–:–");
    await page.getByLabel("Back in from lunch").fill("12:25");
    await expect(page.locator("#out"), "a time alone isn't enough to answer").toHaveText("–:–");
  });
});
