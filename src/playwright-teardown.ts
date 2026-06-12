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

  const mode = process.env.DIRECT_TO_MAIN === "true" ? "direct" : "bugfix-branch";
  console.log(`\n[teardown] Running fix agent (mode: ${mode})…`);

  try {
    await runFixAgent({ mode });
  } finally {
    await closePool();
  }
}
