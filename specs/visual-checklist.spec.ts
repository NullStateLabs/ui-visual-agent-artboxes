/**
 * Generic visual checklist spec.
 *
 * Create a ui-agent.config.ts in the repo root that exports an AgentConfig,
 * then run: pnpm test
 *
 * Set AUTO_FIX=true to automatically open GitHub PRs for any failing tickets
 * immediately after the test suite finishes (requires UI_FIX_GITHUB_TOKEN).
 *
 * See examples/artboxes-config.ts for a reference config.
 */

import { test, expect } from "@playwright/test";
import { upsertBugTicket, closePool } from "../src/helpers/db-ticket.js";
import { runScenario } from "../src/runner/scenario-runner.js";
import { runFixAgent } from "../src/agent/fix-agent.js";
import type { AgentConfig } from "../src/runner/types.js";

let config: AgentConfig;

try {
  const mod = await import("../ui-agent.config.js");
  config = mod.default;
} catch {
  console.warn(
    "No ui-agent.config.ts found in repo root. Create one based on examples/artboxes-config.ts"
  );
  config = { scenarios: [] };
}

// Count only genuinely NEW tickets — duplicates of already-open issues don't
// re-trigger the fix agent (they just refresh the screenshot in the DB).
let newTickets = 0;

test.afterAll(async () => {
  if (newTickets > 0 && process.env.AUTO_FIX === "true") {
    console.log(`\nAuto-fix: ${newTickets} new ticket(s) found — running fix agent…`);
    await runFixAgent({ mode: "bugfix-branch" });
  }
  await closePool();
});

for (const scenario of config.scenarios) {
  test(`[${scenario.viewport?.width ?? 375}px] ${scenario.label}`, async ({ page }) => {
    const { screenshotPath, result } = await runScenario(page, scenario);

    if (!result.pass) {
      for (const finding of result.findings) {
        const { id: ticketId, isNew } = await upsertBugTicket({
          component: scenario.label,
          file_path: scenario.filePath ?? "",
          assertion: finding.description,
          reasoning: finding.reasoning,
          screenshot_path: screenshotPath,
        });

        if (isNew) {
          newTickets++;
          console.error(
            `  [${finding.severity.toUpperCase()}] New ticket #${ticketId}: ${finding.reasoning}`
          );
        } else {
          console.warn(
            `  [${finding.severity.toUpperCase()}] Existing ticket #${ticketId} (screenshot refreshed): ${finding.reasoning}`
          );
        }
      }
    }

    const summary = result.findings
      .map((f) => `[${f.severity}] #${f.id}: ${f.reasoning}`)
      .join("\n");

    expect(result.pass, `Visual issues found:\n${summary}`).toBe(true);
  });
}
