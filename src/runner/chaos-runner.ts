/**
 * Chaos Runner — pre-launch battle hardening mode.
 *
 * Starts at a random route, then lets Claude decide what to click next,
 * recording screenshots and UI issues at every step.
 *
 * Each step:
 *   screenshot → check against 50-issue checklist
 *             → ask Claude what to interact with next
 *             → execute that action
 *
 * All findings across the session are returned to the caller.
 */

import type { Page } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";
import {
  analyzeScreenshotWithChecklist,
  suggestNextAction,
  type ChecklistFinding,
} from "../helpers/llm-vision.js";

const SCREENSHOTS_DIR = path.join(import.meta.dirname, "../../screenshots/chaos");

export interface ChaosSessionOpts {
  /** Number of explore steps per session. Default: 12 */
  steps?: number;
  viewport?: { width: number; height: number };
  /** Severity threshold passed to the checklist analyser. Default: "medium" */
  severityThreshold?: "high" | "medium" | "low";
}

export interface ChaosStepResult {
  step: number;
  route: string;
  screenshotPath: string;
  findings: ChecklistFinding[];
}

export interface ChaosSessionResult {
  startRoute: string;
  steps: ChaosStepResult[];
  /** All unique findings across the session */
  allFindings: ChecklistFinding[];
}

export async function runChaosSession(
  page: Page,
  startRoute: string,
  opts: ChaosSessionOpts = {}
): Promise<ChaosSessionResult> {
  const steps = opts.steps ?? 12;
  const viewport = opts.viewport ?? { width: 375, height: 812 };
  const severityThreshold = opts.severityThreshold ?? "medium";

  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

  await page.setViewportSize(viewport);
  await page.goto(startRoute, { waitUntil: "load" });
  await page.waitForTimeout(600);

  const sessionSteps: ChaosStepResult[] = [];
  const seenFindingIds = new Set<number>();
  const allFindings: ChecklistFinding[] = [];

  for (let i = 0; i < steps; i++) {
    const currentRoute = new URL(page.url()).pathname;
    const slug = currentRoute.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "home";
    const screenshotPath = path.join(SCREENSHOTS_DIR, `step-${String(i + 1).padStart(2, "0")}-${slug}.png`);

    await page.screenshot({ path: screenshotPath, fullPage: false });

    // Analyse for UI issues
    const { findings } = await analyzeScreenshotWithChecklist({
      imagePath: screenshotPath,
      severityThreshold,
    });

    for (const f of findings) {
      if (!seenFindingIds.has(f.id)) {
        seenFindingIds.add(f.id);
        allFindings.push(f);
      }
    }

    sessionSteps.push({ step: i + 1, route: currentRoute, screenshotPath, findings });

    if (findings.length > 0) {
      console.log(
        `  step ${i + 1} [${currentRoute}]: ${findings.length} issue(s) found`
      );
    }

    // Ask Claude what to interact with next
    const action = await suggestNextAction(screenshotPath);

    if (!action) {
      console.log(`  step ${i + 1}: no more interactions suggested, stopping early`);
      break;
    }

    console.log(
      `  step ${i + 1}: ${action.action} "${action.text}" — ${action.reasoning}`
    );

    try {
      const locator = page.getByText(action.text, { exact: false }).first();
      await locator.waitFor({ timeout: 5_000 });

      if (action.action === "fill" && action.value) {
        await locator.fill(action.value);
      } else {
        await locator.click();
      }

      await page.waitForTimeout(500);
    } catch {
      // Element may have disappeared or navigated away — keep going
      console.warn(`  step ${i + 1}: could not interact with "${action.text}", skipping`);
    }
  }

  return { startRoute, steps: sessionSteps, allFindings };
}
