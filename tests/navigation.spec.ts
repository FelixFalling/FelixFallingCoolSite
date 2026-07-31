import { test, expect } from "./fixtures";

/**
 * Tests for getting AROUND the page: the keyboard skip link, the nav's
 * "you are here" highlight, and the scroll-reveal that hides sections until
 * you reach them.
 */

/** Every section link in the nav, in page order. */
const NAV_LABELS = ["About", "Projects", "Games", "Skills", "Activity", "Contact"];

/*
 * A NOTE ON SAFARI AND THE TAB KEY, which shapes the three tests below.
 *
 * WebKit does not put links in the tab order. That is Safari's default
 * ("Press Tab to highlight each item on a webpage" is off in Advanced
 * settings), and Playwright's WebKit mirrors it. Probed on this page, four
 * presses of Tab give:
 *
 *   Chromium: skip-link -> brand -> nav link -> nav link
 *   WebKit:   the Slides carousel, four times
 *
 * - because <div tabindex="0"> IS focusable there while <a href> is not.
 *
 * That is a browser setting, not something the markup can fix, and the skip
 * link is still correct: Safari users who turn full keyboard access on, and
 * every screen reader, reach it normally. So the tests split by what they
 * actually assert - the CSS/markup contract runs everywhere, and only the
 * claim about tab ORDER is limited to the engines that have one for links.
 */
test.describe("skip link", () => {
  test("is off-screen at rest and slides in when focused", async ({ homePage }) => {
    await homePage.goto();

    // Off-screen at rest: present in the DOM (so it's in the tab order) but
    // sitting above the top edge of the page.
    const before = await homePage.skipLink.boundingBox();
    expect(before).not.toBeNull();
    expect(before!.y + before!.height).toBeLessThanOrEqual(0);

    // focus() rather than Tab, so this covers WebKit too - what's under test
    // here is the :focus rule, not the browser's tab order.
    await homePage.skipLink.focus();
    await expect(homePage.skipLink).toBeFocused();

    // It slides in over 150ms, so poll rather than measuring mid-transition.
    await expect
      .poll(async () => (await homePage.skipLink.boundingBox())!.y)
      .toBeGreaterThanOrEqual(0);
  });

  test("is the very first thing Tab reaches", async ({ homePage, page, browserName }) => {
    test.skip(
      browserName === "webkit",
      "Safari leaves links out of the tab order by default - see the note above",
    );
    await homePage.goto();
    await page.keyboard.press("Tab");
    await expect(homePage.skipLink).toBeFocused();
  });

  test("moves focus to the main content, not just the scroll position", async ({
    homePage,
    page,
  }) => {
    await homePage.goto();
    await homePage.skipLink.focus();
    await page.keyboard.press("Enter");

    // If this only scrolled, the next Tab would drop the user back at the top
    // of the nav - which is the bug a skip link exists to prevent.
    await expect(homePage.main).toBeFocused();
  });
});

test.describe("nav highlights the section you're on", () => {
  test("no link is highlighted while you're still in the hero", async ({ homePage }) => {
    await homePage.goto();
    await homePage.scrollTo(0);
    await expect.poll(() => homePage.nav.activeLabel()).toBeNull();
  });

  test("the last section is highlighted at the bottom of the page", async ({ homePage }) => {
    await homePage.goto();
    await homePage.settleHeight();
    await homePage.scrollTo(await homePage.maxScroll());
    await expect.poll(() => homePage.nav.activeLabel()).toBe("Contact");
  });

  /**
   * The regression this file exists for. An earlier version of the scroll spy
   * highlighted a section once its top passed a fixed line near the top of the
   * viewport - which meant the sections crammed into the last screenful were
   * never reachable, because the page stops scrolling before they get there.
   * Activity was permanently unlit at every viewport size and nothing caught
   * it, because each link worked "when you scrolled to it" by other measures.
   *
   * So: walk the whole page and assert that every link gets its turn.
   */
  test("every nav link lights up somewhere on the way down", async ({ homePage }) => {
    await homePage.goto();
    await homePage.settleHeight();
    const max = await homePage.maxScroll();
    const seen = new Set<string>();

    for (let y = 0; y <= max; y += Math.ceil(max / 40)) {
      await homePage.scrollTo(y);
      const label = await homePage.nav.activeLabel();
      if (label) seen.add(label);
    }
    await homePage.scrollTo(max);
    const last = await homePage.nav.activeLabel();
    if (last) seen.add(last);

    expect([...seen].sort()).toEqual([...NAV_LABELS].sort());
  });

  test("the highlight moves down the list as you scroll, never back up", async ({
    homePage,
  }) => {
    await homePage.goto();
    await homePage.settleHeight();
    const max = await homePage.maxScroll();
    const order: number[] = [];

    for (let y = 0; y <= max; y += Math.ceil(max / 40)) {
      await homePage.scrollTo(y);
      const label = await homePage.nav.activeLabel();
      if (label) order.push(NAV_LABELS.indexOf(label));
    }

    // Monotonic: scrolling down should only ever advance the highlight.
    const sorted = [...order].sort((a, b) => a - b);
    expect(order).toEqual(sorted);
  });
});

test.describe("scroll reveal", () => {
  test("sections start hidden and fade in when reached", async ({ homePage }) => {
    await homePage.goto();

    // Far enough down the page that it can't be on screen at load.
    const skills = homePage.section("skills");
    await expect(skills).toHaveCSS("opacity", "0");

    await homePage.scrollToSection("skills");
    await expect(skills).toHaveCSS("opacity", "1");
  });

  test("with reduced motion, nothing is hidden in the first place", async ({
    homePage,
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await homePage.goto();
    await expect(homePage.section("skills")).toHaveCSS("opacity", "1");
  });
});

test.describe("third-party contribution chart", () => {
  test("its section survives the chart failing to load", async ({ homePage, page }) => {
    // ghchart.rshah.org is a small free service outside our control. If it's
    // down the section must degrade to just its caption + profile link, not
    // leave a broken-image icon in the middle of the page.
    await page.route("**ghchart**", (route) => route.abort());
    await homePage.goto();
    await homePage.scrollToSection("activity");

    await expect(homePage.activityChart).toHaveCount(0);
    await expect(homePage.section("activity")).toContainText("green-squares");
  });
});
