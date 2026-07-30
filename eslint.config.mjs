/**
 * ESLint configuration (flat config).
 *
 * WHY THIS FILE EXISTS: Next 16 removed the `next lint` command, so the old
 * `"lint": "next lint"` script in package.json failed outright ("Invalid
 * project directory provided, no such directory: .../lint") - which meant this
 * project had no working linter at all. ESLint is now invoked directly and the
 * Next rules are pulled in as a shared config.
 *
 * `core-web-vitals` is the stricter of the two Next presets: on top of the
 * correctness rules it warns about things that measurably hurt loading
 * performance, which is the whole point of the hand-tuned scene on this site.
 */
import next from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

/** @type {import("eslint").Linter.Config[]} */
const config = [
  {
    // Generated output and dependencies - never our code to fix.
    ignores: [
      ".next/**",
      "out/**",
      "node_modules/**",
      "playwright-report/**",
      "test-results/**",
      // Self-contained, hand-written game pages. They are plain <script> tags
      // in an HTML file, not modules in the build, and ESLint would parse them
      // as neither.
      "public/**",
    ],
  },
  ...next,
  ...typescript,

  {
    rules: {
      /*
       * next/image is the wrong tool for this site. `output: 'export'` in
       * next.config.mjs means there is no server to optimize images at
       * request time, so <Image> would need `unoptimized: true` and would
       * then do strictly less than the plain <img> tags already do: the
       * screenshots are pre-converted to webp, sized at build time, given
       * explicit width/height to reserve their space, and lazy-loaded by
       * hand. Keeping this rule on would mean five permanent warnings that
       * nobody can action.
       */
      "@next/next/no-img-element": "off",
    },
  },

  {
    /*
     * Playwright's test fixtures take a callback conventionally named `use`
     * ({ page }, use) => ... . ESLint's React plugin sees a bare call to
     * `use(...)` and thinks it's React 19's `use()` hook being called outside
     * a component. It isn't - there is no React in the test process at all.
     */
    files: ["tests/**"],
    rules: {
      "react-hooks/rules-of-hooks": "off",
    },
  },
];

export default config;
