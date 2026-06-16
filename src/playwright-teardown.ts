/**
 * Playwright globalTeardown — runs ONCE after all workers finish all tests.
 *
 * This is the single correct place to run the fix agent:
 * - afterAll fires once per worker → multiple parallel fix agent instances
 * - globalTeardown fires once per test run → one fix agent, no races
 */
import { runFixAgent } from "./agent/fix-agent.js";
import { closePool } from "./helpers/db-ticket.js";

export default async function teardown() {
  if (process.env.AUTO_FIX !== "true") return;

  // If the target app was unreachable, every test failed with ERR_CONNECTION_REFUSED —
  // not real UI bugs. Skip the fix agent to avoid generating fixes from stale tickets.
  const baseUrl = process.env.BASE_URL ?? process.env.WEB_URL ?? "http://localhost:3000";
  try {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 5000);
    await fetch(baseUrl, { method: "HEAD", signal: controller.signal });
  } catch {
    console.log(`\n[teardown] ${baseUrl} is not reachable — skipping fix agent (test run was invalid)`);
    await closePool();
    return;
  }

  const mode =
    process.env.CHAOS_MODE === "true"    ? "chaos-branch" :
    process.env.DIRECT_TO_MAIN === "true" ? "direct" :
    "bugfix-branch";
  console.log(`\n[teardown] Running fix agent (mode: ${mode})…`);

  try {
    await runFixAgent({ mode });
  } finally {
    try {
      await closePool();
    } catch (err) {
      console.warn("[teardown] pool.end() failed:", err);
    }
  }
}
