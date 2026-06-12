import type { Page } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";
import type { Scenario, StepAction } from "./types.js";
import { analyzeScreenshotWithChecklist, type ChecklistResult } from "../helpers/llm-vision.js";

const SCREENSHOTS_DIR = path.join(import.meta.dirname, "../../screenshots");

export async function runScenario(
  page: Page,
  scenario: Scenario
): Promise<{ screenshotPath: string; result: ChecklistResult }> {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

  const viewport = scenario.viewport ?? { width: 375, height: 812 };
  await page.setViewportSize(viewport);
  await page.goto(scenario.url, { waitUntil: "load" });

  for (const step of scenario.steps ?? []) {
    try {
      await executeStep(page, step);
    } catch (err: any) {
      // Element not found or not interactable — log and continue so we still screenshot what's visible
      const selector = "selector" in step ? step.selector : step.action;
      console.warn(`  [scenario-runner] Step "${step.action}" on "${selector}" skipped: ${err?.message?.split("\n")[0]}`);
    }
  }

  // Short settle wait after interactions
  if (scenario.steps?.length) {
    await page.waitForTimeout(400);
  }

  const slug = scenario.label.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  const screenshotPath = path.join(SCREENSHOTS_DIR, `${slug}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: false });

  const result = await analyzeScreenshotWithChecklist({
    imagePath: screenshotPath,
    skipIds: scenario.skipIssueIds,
    severityThreshold: scenario.severityThreshold,
  });

  return { screenshotPath, result };
}

const STEP_TIMEOUT = 10_000;

async function executeStep(page: Page, step: StepAction): Promise<void> {
  switch (step.action) {
    case "click":
      await page.locator(step.selector).first().click({ timeout: STEP_TIMEOUT });
      break;
    case "hover":
      await page.locator(step.selector).first().hover({ timeout: STEP_TIMEOUT });
      break;
    case "fill":
      await page.locator(step.selector).first().fill(step.value, { timeout: STEP_TIMEOUT });
      break;
    case "wait":
      await page.waitForTimeout(step.ms);
      break;
    case "scroll":
      await page.locator(step.selector).first().scrollIntoViewIfNeeded({ timeout: STEP_TIMEOUT });
      break;
    case "press":
      await page.locator(step.selector).first().press(step.key, { timeout: STEP_TIMEOUT });
      break;
  }
}
