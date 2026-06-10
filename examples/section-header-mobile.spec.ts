import { test, expect } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";
import { analyzeScreenshot } from "../src/helpers/llm-vision";
import { insertBugTicket, closePool } from "../src/helpers/db-ticket";

const MOBILE_WIDTH = 375;
const MOBILE_HEIGHT = 812;
const SCREENSHOTS_DIR = path.join(import.meta.dirname, "../screenshots");
const COMPONENT = "SectionHeader";
const FILE_PATH = "apps/web/components/design/SectionHeader.tsx";
const ASSERTION = "The title/description block and the action link are stacked vertically (one above the other) on mobile";

test.afterAll(async () => {
  await closePool();
});

test("SectionHeader children stack vertically on mobile", async ({ page }) => {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

  await page.setViewportSize({ width: MOBILE_WIDTH, height: MOBILE_HEIGHT });
  await page.goto("/", { waitUntil: "load" });

  // Find the first SectionHeader that has both a text block and an action link
  const header = page
    .locator('[data-testid="section-header"]')
    .filter({ has: page.locator("a") })
    .first();

  await header.waitFor({ timeout: 15_000 });

  const screenshotPath = path.join(SCREENSHOTS_DIR, "section-header-mobile.png");
  await header.screenshot({ path: screenshotPath });

  const { pass, reasoning } = await analyzeScreenshot({
    imagePath: screenshotPath,
    assertion: ASSERTION,
  });

  if (!pass) {
    const ticketId = await insertBugTicket({
      component: COMPONENT,
      file_path: FILE_PATH,
      assertion: ASSERTION,
      reasoning,
      screenshot_path: screenshotPath,
    });
    console.error(`Bug ticket #${ticketId} created: ${reasoning}`);
  }

  expect(pass, `LLM verdict: ${reasoning}`).toBe(true);
});
