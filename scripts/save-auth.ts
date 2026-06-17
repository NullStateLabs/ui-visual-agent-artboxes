/**
 * Interactive auth capture script.
 *
 * Opens a headed browser, lets you log in manually (Privy, or any other provider),
 * then saves the full browser state (cookies + localStorage) to auth/state.json.
 *
 * Usage:
 *   pnpm auth:save -- --url=https://artboxes.io
 *   pnpm auth:save -- --url=https://staging.artboxes.io
 *   BASE_URL=https://artboxes.io pnpm auth:save
 *
 * After saving, encode the file for use as a GitHub Actions secret:
 *   base64 -i auth/state.json | pbcopy   # macOS — paste into the AUTH_STATE secret
 *
 * The saved file is gitignored. Never commit it — it contains live session tokens.
 */

import { chromium } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";

const BASE_URL =
  process.argv.find((a) => a.startsWith("--url="))?.split("=")[1] ??
  process.env.BASE_URL ??
  null;

if (!BASE_URL) {
  console.error("\nError: no URL provided.\n");
  console.error("Usage:");
  console.error("  pnpm auth:save -- --url=https://artboxes.io");
  console.error("  BASE_URL=https://artboxes.io pnpm auth:save\n");
  process.exit(1);
}

const AUTH_DIR = path.join(process.cwd(), "auth");
const AUTH_FILE = path.join(AUTH_DIR, "state.json");

function prompt(question: string): Promise<void> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, () => {
      rl.close();
      resolve();
    });
  });
}

console.log(`\n🔐 Auth capture — opening browser at ${BASE_URL}`);
console.log("   Log in with your test account (Privy or any other provider).");
console.log("   Press Enter in this terminal once you are fully logged in.\n");

const browser = await chromium.launch({ headless: false });
const context = await browser.newContext();
const page = await context.newPage();

try {
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 30_000 });
} catch (err: any) {
  await browser.close();
  console.error(`\nFailed to open ${BASE_URL}:`);
  console.error(`  ${err.message?.split("\n")[0]}\n`);
  process.exit(1);
}

await prompt("   → Press Enter when logged in: ");

fs.mkdirSync(AUTH_DIR, { recursive: true });
await context.storageState({ path: AUTH_FILE });

const state = JSON.parse(fs.readFileSync(AUTH_FILE, "utf-8"));
const cookieCount = state.cookies?.length ?? 0;
const localStorageCount = state.origins?.reduce(
  (n: number, o: { localStorage: unknown[] }) => n + o.localStorage.length,
  0
) ?? 0;

console.log(`\n✅ Auth state saved to ${AUTH_FILE}`);
console.log(`   ${cookieCount} cookie(s), ${localStorageCount} localStorage key(s)`);
console.log("\n   Next steps:");
console.log("   1. Add to ui-agent.config.ts:");
console.log('      auth: { storageState: "auth/state.json" }');
console.log("   2. Encode for GitHub Actions secret:");
console.log("      base64 -i auth/state.json | pbcopy");
console.log('      Paste into: Settings → Secrets → AUTH_STATE\n');

await browser.close();
process.exit(0);
