/**
 * Serves ./out on a fixed port and stays up - the command Playwright's
 * "export" project points its webServer at. The serving itself lives in
 * serve-out.mjs, which the screenshot script also uses.
 */
import { access } from "node:fs/promises";
import { resolve } from "node:path";
import { serveOut } from "./serve-out.mjs";

const PORT = Number(process.env.EXPORT_PORT ?? 3100);
const OUT_DIR = resolve(import.meta.dirname, "..", "out");

try {
  await access(OUT_DIR);
} catch {
  console.error(
    `No static export at ${OUT_DIR}.\n` +
      `Run \`npm run build\` first - this server deliberately does NOT build for\n` +
      `you, so that what it serves is always the artifact you meant to test.`,
  );
  process.exit(1);
}

const { url } = await serveOut(PORT);
console.log(`serving the static export at ${url}`);
