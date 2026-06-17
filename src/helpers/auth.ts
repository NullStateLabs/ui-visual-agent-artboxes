/**
 * Auth injection helper.
 *
 * Applies a ScenarioAuth state to an existing Playwright page by:
 *   1. Adding cookies to the browser context (available before any navigation)
 *   2. Navigating to the base URL to establish the domain origin
 *   3. Injecting localStorage key/value pairs via page.evaluate()
 *
 * Why this order? Cookies can be set on the context at any time, but
 * localStorage writes require the page to already be on the target origin.
 * We navigate to BASE_URL first (not the final scenario URL) so the caller
 * can navigate to the real URL afterwards with auth already in place.
 */

import type { Page } from "@playwright/test";
import * as fs from "fs";
import type { ScenarioAuth } from "../runner/types.js";

interface StorageStateFile {
  cookies?: Array<{
    name: string;
    value: string;
    domain: string;
    path: string;
    expires?: number;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: "Strict" | "Lax" | "None";
  }>;
  origins?: Array<{
    origin: string;
    localStorage: Array<{ name: string; value: string }>;
  }>;
}

export async function applyAuth(page: Page, auth: ScenarioAuth): Promise<void> {
  const baseUrl = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");

  let storageFile: StorageStateFile | null = null;

  if (auth.storageState) {
    if (!fs.existsSync(auth.storageState)) {
      console.warn(`  [auth] storageState file not found: ${auth.storageState} — skipping auth`);
      return;
    }
    storageFile = JSON.parse(fs.readFileSync(auth.storageState, "utf-8")) as StorageStateFile;
  }

  // ── Step 1: inject cookies (no navigation required) ─────────────────────
  const cookies = storageFile?.cookies ?? [];
  if (cookies.length > 0) {
    await page.context().addCookies(cookies);
  }

  // ── Step 2: navigate to base URL to establish the origin ─────────────────
  const needsLocalStorage =
    (storageFile?.origins?.some((o) => o.localStorage.length > 0) ?? false) ||
    (auth.localStorage && Object.keys(auth.localStorage).length > 0);

  if (needsLocalStorage) {
    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });

    // ── Step 3: inject localStorage ────────────────────────────────────────
    const items: [string, string][] = [];

    // From storageState file
    for (const origin of storageFile?.origins ?? []) {
      for (const { name, value } of origin.localStorage) {
        items.push([name, value]);
      }
    }

    // From explicit localStorage overrides
    for (const [k, v] of Object.entries(auth.localStorage ?? {})) {
      items.push([k, v]);
    }

    if (items.length > 0) {
      await page.evaluate((entries: [string, string][]) => {
        for (const [k, v] of entries) {
          localStorage.setItem(k, v);
        }
      }, items);
    }
  }
}
