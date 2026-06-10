/**
 * Artboxes UI agent config — reference example.
 * Copy this to the repo root as ui-agent.config.ts and adapt.
 */
import type { AgentConfig } from "../src/runner/types.js";

const config: AgentConfig = {
  scenarios: [
    // ── Public pages ──────────────────────────────────────────────
    {
      label: "home — mobile",
      url: "/",
      viewport: { width: 375, height: 812 },
    },
    {
      label: "home — desktop",
      url: "/",
      viewport: { width: 1280, height: 800 },
      severityThreshold: "medium",
    },
    {
      label: "collections list — mobile",
      url: "/collections",
      viewport: { width: 375, height: 812 },
    },

    // ── Interactions: modals ──────────────────────────────────────
    {
      label: "connect wallet modal",
      url: "/",
      viewport: { width: 375, height: 812 },
      steps: [
        { action: "click", selector: "[data-action='connect-wallet'], button:has-text('Connect')" },
        { action: "wait", ms: 600 },
      ],
    },

    // ── Error / empty states ──────────────────────────────────────
    {
      label: "404 page",
      url: "/this-page-does-not-exist",
      viewport: { width: 375, height: 812 },
    },
  ],
};

export default config;
