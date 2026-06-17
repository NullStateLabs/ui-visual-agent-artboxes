/**
 * Interactive auth capture script.
 *
 * Opens a headed browser, lets you log in manually (Privy, or any other provider),
 * then saves the full browser state (cookies + localStorage) to auth/state.json.
 *
 * Usage:
 *   pnpm auth:save
 *   pnpm auth:save -- --url https://staging.yourapp.com
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
  "http://localhost:3000";

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

await page.goto(BASE_URL);

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
