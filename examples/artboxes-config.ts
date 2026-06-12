/**
 * Artboxes UI agent config — reference example.
 * Copy this to the repo root as ui-agent.config.ts and adapt.
 *
 *   cp examples/artboxes-config.ts ui-agent.config.ts
 *
 * Then change the import path from "../src/..." to "./src/..."
 *
 * filePath: path to the source file in the artboxes repo that owns this page.
 * The fix agent will edit this file when it finds a layout bug on that page.
 * If omitted, issues are logged as tickets but cannot be auto-fixed.
 */
import type { AgentConfig } from "../src/runner/types.js";

const config: AgentConfig = {
  scenarios: [
    {
      label: "home — mobile",
      url: "/",
      filePath: "app/page.tsx",
      viewport: { width: 375, height: 812 },
    },
    {
      label: "home — desktop",
      url: "/",
      filePath: "app/page.tsx",
      viewport: { width: 1280, height: 800 },
      severityThreshold: "medium",
    },
    {
      label: "collections — mobile",
      url: "/collections",
      filePath: "app/collections/page.tsx",
      viewport: { width: 375, height: 812 },
    },
    {
      label: "upcoming — mobile",
      url: "/upcoming",
      filePath: "app/upcoming/page.tsx",
      viewport: { width: 375, height: 812 },
    },

    // ── Interactions: modals ────────────────────────────────────────
    // For modals, filePath points to the modal component, not the page
    {
      label: "connect wallet modal",
      url: "/",
      filePath: "components/modals/ConnectWalletModal.tsx",
      viewport: { width: 375, height: 812 },
      steps: [
        { action: "click", selector: "[data-action='connect-wallet'], button:has-text('Connect')" },
        { action: "wait", ms: 600 },
      ],
    },

    // ── Auth-required pages (unauthenticated state) ────────────────
    // These show intentionally empty content — skip issue #8 (empty container)
    {
      label: "shipping — unauthenticated — mobile",
      url: "/shipping",
      filePath: "app/shipping/page.tsx",
      viewport: { width: 375, height: 812 },
      skipIssueIds: [8],
    },
    {
      label: "dashboard — unauthenticated — mobile",
      url: "/dashboard",
      filePath: "app/dashboard/page.tsx",
      viewport: { width: 375, height: 812 },
      skipIssueIds: [8],
    },

    // ── Error / empty states ────────────────────────────────────────
    {
      label: "404 page — mobile",
      url: "/this-page-does-not-exist",
      filePath: "app/not-found.tsx",
      viewport: { width: 375, height: 812 },
      skipIssueIds: [49],
    },
  ],

  // ── Chaos mode routes ─────────────────────────────────────────────
  routes: ["/", "/collections", "/upcoming", "/marketplace"],
};

export default config;
