import { test, expect } from "./fixtures";
import type { Page } from "@playwright/test";

/**
 * The Curse of Ra clock (public/clockmaker.html).
 *
 * It used to ask for three punches - clock in, lunch out, lunch back - and work
 * the lunch break out itself. It now takes the two things a timeclock actually
 * gives you: the time you came back from lunch, and the decimal hours it
 * already shows, lunch already subtracted.
 *
 * The arithmetic is the product; the temple around it is decoration. So most of
 * this asserts on window.__clock directly rather than driving a WebGL scene.
 * The two ways this calculation goes wrong each have a test named after them.
 */

declare global {
  interface Window {
    __clock: {
      clockOutMath(
        backInMin: number,
        hoursWorked: number,
        target: number,
      ): { remainingMins: number; workedMins: number; clockOutMin: number };
      toMin(value: string): number | null;
      fmt12(mins: number): string;
      fmtDur(mins: number): string;
      targetHours(): number;
    };
  }
}

/** Run the page's own maths and format it the way the panel does. */
async function clockOut(page: Page, backIn: string, worked: number, target = 8) {
  return page.evaluate(
    ([time, hours, targetHours]) => {
      const api = window.__clock;
      const result = api.clockOutMath(
        api.toMin(time as string)!,
        hours as number,
        targetHours as number,
      );
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

test.describe("the Curse of Ra clock", () => {
  /*
   * Reduced motion, and not only for tidiness. This page runs a WebGL render
   * loop, and on CI - one worker on a two-core runner, with the whole matrix
   * queued behind it - a page pegging a core made Playwright's 30s
   * actionability and text timeouts genuinely reachable. Three tests failed
   * there while passing everywhere locally: #sub read as empty and
   * selectOption sat waiting on a resolved <select>, both the signature of a
   * page too busy to respond rather than a page that is wrong.
   *
   * With this the scene renders at 4fps instead of 60 (see the loop in
   * clockmaker.html), which is what the preference should have meant all
   * along. Measured: the page schedules 121 animation frames a second
   * normally, and none at all under this.
   */
  test.beforeEach(async ({ page, isMobile }) => {
    test.skip(isMobile, "desktop only - one platform is enough for the clock");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("./clockmaker.html");

    /*
     * THE PAGE NEEDS WebGL, AND THAT IS A REAL LIMITATION, not just a test
     * inconvenience. The whole panel - inputs, calculator and all - is wired
     * up in the same script that builds the 3D temple, and that script THROWS
     * when WebGL is unavailable, so nothing below it runs: no window.__clock,
     * and a full-screen "the vision will not form" notice over everything.
     *
     * That was fine while this was a game. It is not fine now that it is the
     * thing you check before going home, and it should be fixed by wiring the
     * panel independently of the scene. Until then, skipping honestly here
     * beats a green suite that quietly stops covering an engine: headless
     * WebKit on CI has no WebGL, which is what turned the WebKit
     * project red rather than anything about the arithmetic.
     */
    const has3D = await page.evaluate(
      () => getComputedStyle(document.getElementById("webglMsg")!).display === "none",
    );
    test.skip(!has3D, "no WebGL in this browser, and the panel is inside the 3D script");

    await page.waitForFunction(() => Boolean(window.__clock));
  });

  test("the worked example", async ({ page }) => {
    // Back at 12:25 PM with 4.02 hr on the clock, aiming at 8.
    const result = await clockOut(page, "12:25", 4.02);
    expect(result.at).toBe("4:24 PM");
    expect(result.remaining).toBe("3h 59m");
    expect(result.worked).toBe("4h 1m");
  });

  test("rounds to the nearest minute rather than truncating", async ({ page }) => {
    /*
     * 8 − 4.02 = 3.98 hr = 238.8 minutes. Truncating gives 238 and answers
     * 4:23 PM; only rounding gives 4:24 PM. This is the difference between
     * leaving on time and leaving a minute early, every day.
     */
    const result = await clockOut(page, "12:25", 4.02);
    expect(result.remainingMins).toBe(239);
    expect(result.at, "truncated instead of rounding - a minute early").not.toBe("4:23 PM");
  });

  test("treats the decimal as a fraction of an hour, not as minutes", async ({ page }) => {
    /*
     * .5 hr is 30 minutes, not 5. Reading the decimal part as minutes is wrong
     * by up to 36 minutes, and 4.50 is where it shows worst: 3.5 hr remaining
     * is 3h 30m, so noon + that is 3:30 PM. Read as "4h 50m worked" it would
     * answer 3:10 PM.
     */
    const result = await clockOut(page, "12:00", 4.5);
    expect(result.at).toBe("3:30 PM");
    expect(result.remaining).toBe("3h 30m");
  });

  test("the check line always adds up to the target", async ({ page }) => {
    /*
     * The panel shows "<worked> + <remaining> = <target> ✓", and that line
     * exists to be checked at a glance - so it must never print a total that
     * isn't the target. Rounding the halves independently can disagree by a
     * minute when either lands on a .5, which is why worked is derived by
     * subtraction. Swept across every hundredth of an hour.
     */
    const mismatches = await page.evaluate(() => {
      const bad: string[] = [];
      for (let hundredths = 0; hundredths <= 800; hundredths++) {
        const r = window.__clock.clockOutMath(0, hundredths / 100, 8);
        if (r.workedMins + r.remainingMins !== 480) bad.push(`${hundredths / 100}`);
      }
      return bad;
    });
    expect(mismatches).toEqual([]);
  });

  test("a period target is the same sum with a different number", async ({ page }) => {
    // 36.75 hr into a 40-hour week, back at 1 PM: 3.25 hr = 3h 15m left.
    expect((await clockOut(page, "13:00", 36.75, 40)).at).toBe("4:15 PM");
    expect((await clockOut(page, "13:00", 76.75, 80)).at).toBe("4:15 PM");
    expect((await clockOut(page, "13:00", 20.5, 24)).at).toBe("4:30 PM");
  });

  test("a late shift crossing midnight still reads sensibly", async ({ page }) => {
    // Back at 9:30 PM with 2 hr done: 6 h left lands at 3:30 AM, not 27:30.
    expect((await clockOut(page, "21:30", 2)).at).toBe("3:30 AM");
  });

  test("the panel answers, and shows its working", async ({ page }) => {
    await page.locator("#backIn").fill("12:25");
    await page.locator("#worked").fill("4.02");

    await expect(page.locator("#out")).toHaveText("4:24 PM");
    const working = page.locator("#sub");
    await expect(working).toContainText("4.02 hr worked (4h 1m) · 3h 59m remaining");
    await expect(working, "the check line is what catches a slip").toContainText(
      "4h 1m + 3h 59m = 8h ✓",
    );
  });

  test("it waits for both inputs before answering", async ({ page }) => {
    await expect(page.locator("#out")).toHaveText("–:–");
    await page.locator("#backIn").fill("12:25");
    await expect(page.locator("#out"), "a time alone can't answer").toHaveText("–:–");
    await expect(page.locator("#sub")).toContainText("decimal your timeclock shows");
  });

  test("every whole 8-hour day is offered, 8 through 80", async ({ page }) => {
    /*
     * The list is a ladder of full shifts, and it used to have rungs missing:
     * 8 → 24 → 40 → 72 → 80. Two days, four days, six, seven and eight were all
     * absent, so anyone working one of those patterns had to open Custom and
     * type a number the dropdown should simply have had.
     *
     * Asserted as the exact expected set rather than "at least these", so a
     * future edit cannot quietly drop a rung back out again.
     */
    const values = await page
      .locator("#targetSel option")
      .evaluateAll((opts) => opts.map((o) => (o as HTMLOptionElement).value));

    const eightHourDays = Array.from({ length: 10 }, (_, i) => String((i + 1) * 8));
    expect(values, "the ladder of full 8-hour days has a rung missing").toEqual([
      ...eightHourDays,
      "custom",
    ]);
  });

  test("each 8-hour rung actually drives the answer", async ({ page }) => {
    /*
     * Adding <option>s to the markup would satisfy the test above while the
     * value behind a new one went nowhere, so this walks the whole ladder
     * through the REAL control: pick the option, read what the panel says.
     *
     * That path matters and is easy to miss. The clockOut() helper used by the
     * other tests in this file calls window.__clock.clockOutMath() directly
     * with a number, which skips the selector, targetHours() and the render
     * entirely - so a dropdown wired to nothing would sail past it. (Checked:
     * an earlier version of this test used that helper and did not notice a
     * deliberately broken option value.)
     *
     * Back at 12:00 with (target - 8) hours banked leaves exactly one 8-hour
     * shift on every rung, so the answer is 8:00 PM every time. One expected
     * value across ten targets makes a wrong one obvious instead of arithmetic
     * to re-check per row.
     */
    await page.locator("#backIn").fill("12:00");

    for (let hours = 8; hours <= 80; hours += 8) {
      await page.locator("#worked").fill(String(hours - 8));
      await page.locator("#targetSel").selectOption(String(hours));
      await expect(
        page.locator("#out"),
        `the ${hours} h option should leave one 8-hour shift from 12:00`,
      ).toHaveText("8:00 PM");
    }
  });

  test("the target selector changes the answer", async ({ page }) => {
    await page.locator("#backIn").fill("12:00");
    await page.locator("#worked").fill("20");
    await page.locator("#targetSel").selectOption("24");
    await expect(page.locator("#out")).toHaveText("4:00 PM");

    // Custom reveals its own field and takes over.
    await page.locator("#targetSel").selectOption("custom");
    await expect(page.locator("#targetCustom")).toBeVisible();
    await page.locator("#targetCustom").fill("22.5");
    await expect(page.locator("#out")).toHaveText("2:30 PM");
  });

  test("says so when the target is already met", async ({ page }) => {
    await page.locator("#backIn").fill("12:25");
    await page.locator("#worked").fill("8.5");
    await expect(page.locator("#out")).toHaveText("Done!");
    await expect(page.locator("#sub")).toContainText("past it by 30m");
  });

  test("the cartouche carves your return", async ({ page }) => {
    // The button is the one punch left: it stamps the back-from-lunch time.
    await expect(page.locator("#backIn")).toHaveValue("");
    await page.locator("#actionBtn").click();
    await expect(page.locator("#backIn")).not.toHaveValue("");
    await expect(page.locator("#actionBtn")).toBeDisabled();
  });

  test("loads with no console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(String(error)));
    await page.reload();
    await page.waitForTimeout(1200);
    expect(errors).toEqual([]);
  });
});
