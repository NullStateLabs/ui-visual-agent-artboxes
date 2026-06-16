import { test, expect } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";
import { analyzeScreenshotWithChecklist } from "../src/helpers/llm-vision.js";
import { upsertBugTicket, closePool } from "../src/helpers/db-ticket.js";

const MOBILE_WIDTH = 375;
const MOBILE_HEIGHT = 812;
const SCREENSHOTS_DIR = path.join(import.meta.dirname, "../screenshots");
const COMPONENT = "SectionHeader";
const FILE_PATH = "apps/web/components/design/SectionHeader.tsx";

test.afterAll(async () => {
  await closePool();
});

test("SectionHeader children stack vertically on mobile", async ({ page }) => {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

  await page.setViewportSize({ width: MOBILE_WIDTH, height: MOBILE_HEIGHT });
  await page.goto("/", { waitUntil: "load" });

  const header = page
    .locator('[data-testid="section-header"]')
    .filter({ has: page.locator("a") })
    .first();

  await header.waitFor({ timeout: 15_000 });

  const screenshotPath = path.join(SCREENSHOTS_DIR, "section-header-mobile.png");
  await header.screenshot({ path: screenshotPath });

  const { pass, findings } = await analyzeScreenshotWithChecklist({
    imagePath: screenshotPath,
    severityThreshold: "medium",
  });

  if (!pass) {
    for (const finding of findings) {
      const { id: ticketId } = await upsertBugTicket({
        component: COMPONENT,
        file_path: FILE_PATH,
        assertion: finding.description,
        reasoning: finding.reasoning,
        screenshot_path: screenshotPath,
      });
      console.error(`Bug ticket #${ticketId}: ${finding.reasoning}`);
    }
  }

  const summary = findings.map((f) => `[${f.severity}] ${f.reasoning}`).join("\n");
  expect(pass, `Visual issues found:\n${summary}`).toBe(true);
});
