/**
 * Chaos Runner — pre-launch battle hardening mode.
 *
 * Starts at a given route, then lets Claude decide what to click next,
 * recording screenshots and UI issues at every step.
 *
 * Each step:
 *   screenshot → check against checklist (respecting skipIds)
 *             → ask Claude what to interact with next (with action history)
 *             → scroll element into view → execute that action
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

const SCREENSHOTS_BASE = path.join(import.meta.dirname, "../../screenshots/chaos");

export interface ChaosSessionOpts {
  /** Number of explore steps per session. Default: 12 */
  steps?: number;
  viewport?: { width: number; height: number };
  /** Severity threshold passed to the checklist analyser. Default: "medium" */
  severityThreshold?: "high" | "medium" | "low";
  /** Issue IDs to skip globally for this session */
  skipIds?: number[];
  /** Unique session label used for the screenshot directory (e.g. a timestamp slug) */
  sessionId?: string;
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
  /** All unique findings across the session (deduped by checklist issue ID) */
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
  const skipIds = opts.skipIds ?? [];

  // Isolate screenshots per session so concurrent runs don't clobber each other
  const sessionSlug = opts.sessionId ?? (startRoute.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "home");
  const screenshotsDir = path.join(SCREENSHOTS_BASE, sessionSlug);
  fs.mkdirSync(screenshotsDir, { recursive: true });

  await page.setViewportSize(viewport);
  await page.goto(startRoute, { waitUntil: "load" });
  await page.waitForTimeout(600);

  const sessionSteps: ChaosStepResult[] = [];
  const seenFindingIds = new Set<number>();
  const allFindings: ChecklistFinding[] = [];
  // Track actions taken this session so Claude doesn't repeat them
  const triedActions: string[] = [];

  for (let i = 0; i < steps; i++) {
    const currentRoute = new URL(page.url()).pathname;
    const routeSlug = currentRoute.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "home";
    const screenshotPath = path.join(
      screenshotsDir,
      `step-${String(i + 1).padStart(2, "0")}-${routeSlug}.png`
    );

    await page.screenshot({ path: screenshotPath, fullPage: false });

    const { findings } = await analyzeScreenshotWithChecklist({
      imagePath: screenshotPath,
      severityThreshold,
      skipIds,
    });

    for (const f of findings) {
      if (!seenFindingIds.has(f.id)) {
        seenFindingIds.add(f.id);
        allFindings.push(f);
      }
    }

    sessionSteps.push({ step: i + 1, route: currentRoute, screenshotPath, findings });

    if (findings.length > 0) {
      console.log(`  step ${i + 1} [${currentRoute}]: ${findings.length} issue(s) found`);
    }

    // Ask Claude what to interact with next, passing the full history so it doesn't repeat
    const action = await suggestNextAction(screenshotPath, { triedActions });

    if (!action) {
      console.log(`  step ${i + 1}: no more interactions suggested, stopping early`);
      break;
    }

    const actionLabel = `${action.action} "${action.text}"`;
    console.log(`  step ${i + 1}: ${actionLabel} — ${action.reasoning}`);
    triedActions.push(actionLabel);

    try {
      // Try buttons and links first (by role), fall back to any text match
      const locator = page
        .getByRole("button", { name: action.text, exact: false })
        .or(page.getByRole("link", { name: action.text, exact: false }))
        .or(page.getByText(action.text, { exact: false }))
        .first();

      // Scroll the element into view before interacting
      await locator.waitFor({ timeout: 5_000 });
      await locator.scrollIntoViewIfNeeded();

      if (action.action === "fill" && action.value) {
        await locator.fill(action.value);
      } else {
        await locator.click();
      }

      await page.waitForTimeout(500);
    } catch {
      console.warn(`  step ${i + 1}: could not interact with "${action.text}", skipping`);
    }
  }

  return { startRoute, steps: sessionSteps, allFindings };
}
