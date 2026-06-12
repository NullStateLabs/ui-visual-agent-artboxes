/**
 * Chaos spec — pre-launch battle hardening mode.
 *
 * Picks routes from ui-agent.config.ts → config.routes, discovers them via
 * /sitemap.xml if omitted, or falls back to ["/"].
 *
 * For each route, Claude autonomously explores the UI for CHAOS_STEPS steps,
 * deciding what to click next based on screenshots. Any issues found are
 * inserted as bug tickets.
 *
 * Set AUTO_FIX=true + DIRECT_TO_MAIN=true to commit fixes straight to the
 * base branch. The fix agent runs in globalTeardown (playwright.config.ts)
 * once after all workers finish — not once per worker.
 *
 * Run manually:  pnpm test:chaos
 * Run in CI:     pnpm test:chaos:ci   (sets AUTO_FIX + DIRECT_TO_MAIN)
 */

import { test, expect } from "@playwright/test";
import { upsertBugTicket, closePool } from "../src/helpers/db-ticket.js";
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

const routes: string[] =
  config.routes && config.routes.length > 0
    ? config.routes
    : await discoverRoutes(BASE_URL);

test.afterAll(async () => {
  await closePool();
});

for (const route of routes) {
  test(`chaos [${CHAOS_STEPS} steps]: ${route}`, async ({ page }) => {
    const session = await runChaosSession(page, route, { steps: CHAOS_STEPS });

    for (const stepResult of session.steps) {
      for (const finding of stepResult.findings) {
        const { id: ticketId, isNew } = await upsertBugTicket({
          component: `chaos:${stepResult.route}`,
          file_path: stepResult.route,
          assertion: finding.description,
          reasoning: finding.reasoning,
          screenshot_path: stepResult.screenshotPath,
        });

        if (isNew) {
          console.error(
            `  [${finding.severity.toUpperCase()}] step ${stepResult.step} — new ticket #${ticketId}: ${finding.reasoning}`
          );
        } else {
          console.warn(
            `  [${finding.severity.toUpperCase()}] step ${stepResult.step} — existing ticket #${ticketId}: ${finding.reasoning}`
          );
        }
      }
    }

    const totalIssues = session.allFindings.length;
    const summary = session.allFindings
      .map((f) => `[${f.severity}] #${f.id}: ${f.reasoning}`)
      .join("\n");

    expect(totalIssues, `Chaos session found ${totalIssues} unique issue(s):\n${summary}`).toBe(0);
  });
}
