import { chromium } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

const MOBILE_WIDTH = 375;
const MOBILE_HEIGHT = 812;
const SCREENSHOTS_DIR = path.join(import.meta.dirname, "../screenshots");

export async function takeComponentScreenshot(opts: {
  url: string;
  selector: string;
  outputFile: string;
}): Promise<string> {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.setViewportSize({ width: MOBILE_WIDTH, height: MOBILE_HEIGHT });
  await page.goto(opts.url, { waitUntil: "networkidle" });

  const element = page.locator(opts.selector).first();
  await element.waitFor({ timeout: 15_000 });

  const outPath = path.join(SCREENSHOTS_DIR, opts.outputFile);
  await element.screenshot({ path: outPath });

  await browser.close();
  return outPath;
}

// Run directly: pnpm screenshot
if (process.argv[1] === import.meta.filename) {
  const url = process.env.BASE_URL ?? "http://localhost:3000";
  takeComponentScreenshot({
    url,
    selector: '[data-testid="section-header"]',
    outputFile: "section-header-mobile.png",
  }).then((p) => console.log("Screenshot saved:", p));
}
