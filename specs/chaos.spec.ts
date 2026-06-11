/**
 * Chaos spec — pre-launch battle hardening mode.
 *
 * Picks routes from ui-agent.config.ts → config.routes, discovers them via
 * /sitemap.xml if omitted, or falls back to ["/"].
 *
 * For each route, Claude autonomously explores the UI for CHAOS_STEPS steps,
 * deciding what to click next based on screenshots. Any issues found are
 * inserted as bug tickets. When DIRECT_TO_MAIN=true, fixes are committed
 * straight to the base branch (no PR).
 *
 * Run manually:  pnpm test:chaos
 * Run in CI:     pnpm test:chaos:ci   (sets AUTO_FIX + DIRECT_TO_MAIN)
 */

import { test, expect } from "@playwright/test";
import { insertBugTicket, closePool } from "../src/helpers/db-ticket.js";
import { runFixAgent } from "../src/agent/fix-agent.js";
import { runChaosSession } from "../src/runner/chaos-runner.js";
import { discoverRoutes } from "../src/helpers/sitemap.js";
import type { AgentConfig } from "../src/runner/types.js";

const CHAOS_STEPS = parseInt(process.env.CHAOS_STEPS ?? "12", 10);
const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

let config: AgentConfig;
try {
  const mod = await import("../ui-agent.config.js");
  config = mod.default;
} catch {
  config = { scenarios: [] };
}

// Resolve routes: config → sitemap → ["/"]
const routes: string[] =
  config.routes && config.routes.length > 0
    ? config.routes
    : await discoverRoutes(BASE_URL);

let ticketsCreated = 0;

test.afterAll(async () => {
  if (ticketsCreated > 0 && process.env.AUTO_FIX === "true") {
    console.log(`\nAuto-fix: processing ${ticketsCreated} ticket(s) — committing directly to main…`);
    await runFixAgent({ mode: "direct" });
  }
  await closePool();
});

for (const route of routes) {
  test(`chaos [${CHAOS_STEPS} steps]: ${route}`, async ({ page }) => {
    const session = await runChaosSession(page, route, { steps: CHAOS_STEPS });

    for (const stepResult of session.steps) {
      for (const finding of stepResult.findings) {
        const ticketId = await insertBugTicket({
          component: `chaos:${stepResult.route}`,
          file_path: stepResult.route,
          assertion: finding.description,
          reasoning: finding.reasoning,
          screenshot_path: stepResult.screenshotPath,
        });
        ticketsCreated++;
        console.error(
          `  [${finding.severity.toUpperCase()}] step ${stepResult.step} — ticket #${ticketId}: ${finding.reasoning}`
        );
      }
    }

    const totalIssues = session.allFindings.length;
    const summary = session.allFindings
      .map((f) => `[${f.severity}] #${f.id}: ${f.reasoning}`)
      .join("\n");

    expect(totalIssues, `Chaos session found ${totalIssues} unique issue(s):\n${summary}`).toBe(0);
  });
}
