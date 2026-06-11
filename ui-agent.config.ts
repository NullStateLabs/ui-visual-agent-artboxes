import type { AgentConfig } from "./src/runner/types.js";

const config: AgentConfig = {
  // ─────────────────────────────────────────────────────────────────────────────
  // NIGHTLY SCENARIOS
  // Each scenario = one deterministic test: navigate → optional steps → screenshot
  // → 50-issue checklist → Postgres ticket if fail → fix-agent opens PR
  // ─────────────────────────────────────────────────────────────────────────────
  scenarios: [

    // ── Home ─────────────────────────────────────────────────────────────────
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
      label: "home — tablet",
      url: "/",
      viewport: { width: 768, height: 1024 },
      severityThreshold: "medium",
    },

    // ── Collections ───────────────────────────────────────────────────────────
    {
      label: "collections list — mobile",
      url: "/collections",
      viewport: { width: 375, height: 812 },
      severityThreshold: "medium",
      skipIssueIds: [49],
    },
    {
      label: "collections list — desktop",
      url: "/collections",
      viewport: { width: 1280, height: 800 },
      severityThreshold: "medium",
      skipIssueIds: [49],
    },
    {
      label: "collections — filter interaction",
      url: "/collections",
      viewport: { width: 375, height: 812 },
      severityThreshold: "medium",
      skipIssueIds: [49],
      steps: [
        { action: "click", selector: "select, [role='combobox'], button:has-text('All')" },
        { action: "wait", ms: 500 },
      ],
    },

    // ── Marketplace ───────────────────────────────────────────────────────────
    {
      label: "marketplace — mobile",
      url: "/marketplace",
      viewport: { width: 375, height: 812 },
      severityThreshold: "medium",
      skipIssueIds: [49],
    },
    {
      label: "marketplace — desktop",
      url: "/marketplace",
      viewport: { width: 1280, height: 800 },
      severityThreshold: "medium",
      skipIssueIds: [49],
    },

    // ── Auth flow ─────────────────────────────────────────────────────────────
    {
      // KNOWN ISSUE: Privy modal opens without a dark overlay/scrim.
      // Background content bleeds through — HIGH severity real bug.
      label: "sign in modal — mobile",
      url: "/",
      viewport: { width: 375, height: 812 },
      steps: [
        { action: "click", selector: "button:has-text('Sign In')" },
        { action: "wait", ms: 800 },
      ],
    },
    {
      label: "sign in modal — desktop",
      url: "/",
      viewport: { width: 1280, height: 800 },
      steps: [
        { action: "click", selector: "button:has-text('Sign In')" },
        { action: "wait", ms: 800 },
      ],
      severityThreshold: "medium",
    },

    // ── Static / content pages ────────────────────────────────────────────────
    {
      label: "about — mobile",
      url: "/about",
      viewport: { width: 375, height: 812 },
    },
    {
      label: "faq — mobile",
      url: "/faq",
      viewport: { width: 375, height: 812 },
    },
    {
      label: "faq — expand first item",
      url: "/faq",
      viewport: { width: 375, height: 812 },
      steps: [
        { action: "click", selector: "[data-state], details summary, button[aria-expanded]" },
        { action: "wait", ms: 400 },
      ],
    },
    {
      label: "learn — mobile",
      url: "/learn",
      viewport: { width: 375, height: 812 },
    },
    {
      label: "blog — mobile",
      url: "/blog",
      viewport: { width: 375, height: 812 },
      severityThreshold: "medium",
      skipIssueIds: [49],
    },
    {
      label: "help — mobile",
      url: "/help",
      viewport: { width: 375, height: 812 },
    },
    {
      label: "contact — mobile",
      url: "/contact",
      viewport: { width: 375, height: 812 },
    },
    {
      label: "careers — mobile",
      url: "/careers",
      viewport: { width: 375, height: 812 },
      severityThreshold: "medium",
    },
    {
      label: "developers — mobile",
      url: "/developers",
      viewport: { width: 375, height: 812 },
      severityThreshold: "medium",
    },
    {
      label: "privacy — mobile",
      url: "/privacy",
      viewport: { width: 375, height: 812 },
      severityThreshold: "medium",
    },
    {
      label: "shipping info — mobile",
      url: "/shipping",
      viewport: { width: 375, height: 812 },
    },

    // ── Error / edge states ───────────────────────────────────────────────────
    {
      // KNOWN ISSUE: 404 page has large empty area with no illustration.
      // Tracking as UX debt — issue #49 kept intentionally failing.
      label: "404 page — mobile",
      url: "/this-page-does-not-exist",
      viewport: { width: 375, height: 812 },
      skipIssueIds: [8],
    },
    {
      label: "404 page — desktop",
      url: "/this-page-does-not-exist",
      viewport: { width: 1280, height: 800 },
      skipIssueIds: [8],
      severityThreshold: "medium",
    },
  ],

  // ─────────────────────────────────────────────────────────────────────────────
  // CHAOS MODE ROUTES
  // Claude autonomously explores these pages, clicking whatever looks interesting.
  // Used by: pnpm test:chaos  /  chaos.yml GitHub Action (pre-launch only)
  // ─────────────────────────────────────────────────────────────────────────────
  routes: [
    "/",
    "/collections",
    "/marketplace",
    "/about",
    "/faq",
    "/learn",
    "/blog",
    "/help",
    "/contact",
    "/developers",
  ],
};

export default config;
