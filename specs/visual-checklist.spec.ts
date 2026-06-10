/**
 * Generic visual checklist spec.
 *
 * Create a ui-agent.config.ts in the repo root that exports an AgentConfig,
 * then run: pnpm test
 *
 * See examples/artboxes-config.ts for a reference config.
 */

import { test, expect } from "@playwright/test";
import { insertBugTicket, closePool } from "../src/helpers/db-ticket.js";
import { runScenario } from "../src/runner/scenario-runner.js";
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

test.afterAll(async () => {
  await closePool();
});

for (const scenario of config.scenarios) {
  test(`[${scenario.viewport?.width ?? 375}px] ${scenario.label}`, async ({ page }) => {
    const { screenshotPath, result } = await runScenario(page, scenario);

    if (!result.pass) {
      for (const finding of result.findings) {
        const ticketId = await insertBugTicket({
          component: scenario.label,
          file_path: scenario.url,
          assertion: finding.description,
          reasoning: finding.reasoning,
          screenshot_path: screenshotPath,
        });
        console.error(
          `  [${finding.severity.toUpperCase()}] Bug ticket #${ticketId}: ${finding.reasoning}`
        );
      }
    }

    const summary = result.findings
      .map((f) => `[${f.severity}] #${f.id}: ${f.reasoning}`)
      .join("\n");

    expect(result.pass, `Visual issues found:\n${summary}`).toBe(true);
  });
}
