import type { AgentConfig } from "./src/runner/types.js";

const config: AgentConfig = {
  scenarios: [
    // ── Mobile: core marketing pages ──────────────────────────────────
    {
      label: "home — mobile",
      url: "/",
      viewport: { width: 375, height: 812 },
    },
    {
      label: "learn — mobile",
      url: "/learn",
      viewport: { width: 375, height: 812 },
    },
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
      label: "blog — mobile",
      url: "/blog",
      viewport: { width: 375, height: 812 },
    },
    {
      label: "contact — mobile",
      url: "/contact",
      viewport: { width: 375, height: 812 },
    },
    {
      label: "help — mobile",
      url: "/help",
      viewport: { width: 375, height: 812 },
    },
    {
      label: "careers — mobile",
      url: "/careers",
      viewport: { width: 375, height: 812 },
    },

    // ── Mobile: product pages ─────────────────────────────────────────
    {
      label: "collections — mobile",
      url: "/collections",
      viewport: { width: 375, height: 812 },
      severityThreshold: "medium",
      // Issue #49 (empty state) fires because the local Prisma schema
      // is missing the finalClaimDate column — collections don't load in dev.
      // In production CI this passes fine. Skip until schema is synced.
      skipIssueIds: [49],
    },
    {
      label: "marketplace — mobile",
      url: "/marketplace",
      viewport: { width: 375, height: 812 },
      severityThreshold: "medium",
      skipIssueIds: [49],
    },
    {
      label: "upcoming — mobile",
      url: "/upcoming",
      viewport: { width: 375, height: 812 },
      severityThreshold: "medium",
      skipIssueIds: [49],
    },

    // ── Mobile: auth-gated pages (unauthenticated state) ──────────────
    {
      label: "shipping — unauthenticated — mobile",
      url: "/shipping",
      viewport: { width: 375, height: 812 },
      // Renders "Sign in to manage your shipping address" centred message
      skipIssueIds: [49],
    },
    {
      label: "dashboard — unauthenticated — mobile",
      url: "/dashboard",
      viewport: { width: 375, height: 812 },
      skipIssueIds: [49],
    },

    // ── Mobile: error states ──────────────────────────────────────────
    {
      // KNOWN ISSUE: 404 page has a large empty area between the nav and
      // error message with no illustration or guidance. Issue #49 tracked
      // as UX debt; #8 (broken image) intentionally skipped.
      label: "404 page — mobile",
      url: "/this-page-does-not-exist",
      viewport: { width: 375, height: 812 },
      skipIssueIds: [8],
    },

    // ── Desktop: core marketing pages ────────────────────────────────
    {
      label: "home — desktop",
      url: "/",
      viewport: { width: 1280, height: 800 },
      severityThreshold: "medium",
    },
    {
      label: "learn — desktop",
      url: "/learn",
      viewport: { width: 1280, height: 800 },
      severityThreshold: "medium",
    },
    {
      label: "about — desktop",
      url: "/about",
      viewport: { width: 1280, height: 800 },
      severityThreshold: "medium",
    },
    {
      label: "faq — desktop",
      url: "/faq",
      viewport: { width: 1280, height: 800 },
      severityThreshold: "medium",
    },
    {
      label: "blog — desktop",
      url: "/blog",
      viewport: { width: 1280, height: 800 },
      severityThreshold: "medium",
    },
    {
      label: "contact — desktop",
      url: "/contact",
      viewport: { width: 1280, height: 800 },
      severityThreshold: "medium",
    },
    {
      label: "help — desktop",
      url: "/help",
      viewport: { width: 1280, height: 800 },
      severityThreshold: "medium",
    },

    // ── Desktop: product pages ────────────────────────────────────────
    {
      label: "collections — desktop",
      url: "/collections",
      viewport: { width: 1280, height: 800 },
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
    {
      label: "upcoming — desktop",
      url: "/upcoming",
      viewport: { width: 1280, height: 800 },
      severityThreshold: "medium",
      skipIssueIds: [49],
    },

    // ── Desktop: wide viewport (1440) ─────────────────────────────────
    {
      label: "home — wide desktop",
      url: "/",
      viewport: { width: 1440, height: 900 },
      severityThreshold: "medium",
    },
    {
      label: "collections — wide desktop",
      url: "/collections",
      viewport: { width: 1440, height: 900 },
      severityThreshold: "medium",
      skipIssueIds: [49],
    },
    {
      label: "marketplace — wide desktop",
      url: "/marketplace",
      viewport: { width: 1440, height: 900 },
      severityThreshold: "medium",
      skipIssueIds: [49],
    },

    // ── Mobile: interactive scenarios ─────────────────────────────────
    {
      // KNOWN ISSUE: Sign-in modal (Privy) opens without a dark overlay/scrim
      // behind it — background content bleeds through. HIGH severity real bug.
      label: "sign in modal — mobile",
      url: "/",
      viewport: { width: 375, height: 812 },
      steps: [
        { action: "click", selector: "button:has-text('Sign In')" },
        { action: "wait", ms: 800 },
      ],
    },
    {
      label: "faq accordion — first item expanded — mobile",
      url: "/faq",
      viewport: { width: 375, height: 812 },
      steps: [
        // <details><summary> accordion — .first() in the runner picks the first match
        { action: "click", selector: "details summary" },
        { action: "wait", ms: 300 },
      ],
    },
    {
      label: "home hero carousel — second page — mobile",
      url: "/",
      viewport: { width: 375, height: 812 },
      steps: [
        { action: "wait", ms: 1500 },
        { action: "click", selector: "button[aria-label='Next collections']" },
        { action: "wait", ms: 600 },
      ],
    },
    {
      label: "collections search filter — mobile",
      url: "/collections",
      viewport: { width: 375, height: 812 },
      steps: [
        { action: "wait", ms: 1200 },
        {
          action: "fill",
          selector: "input[placeholder='Search by title or artist…']",
          value: "paint",
        },
        { action: "wait", ms: 500 },
      ],
      skipIssueIds: [49],
    },

    // ── Desktop: interactive scenarios ────────────────────────────────
    {
      label: "sign in modal — desktop",
      url: "/",
      viewport: { width: 1280, height: 800 },
      steps: [
        { action: "click", selector: "button:has-text('Sign In')" },
        { action: "wait", ms: 800 },
      ],
    },
    {
      label: "global search with query — desktop",
      url: "/",
      viewport: { width: 1280, height: 800 },
      steps: [
        {
          action: "fill",
          selector: "input[placeholder='Search collections, artists…']",
          value: "art",
        },
        { action: "wait", ms: 700 },
      ],
    },
    {
      label: "faq accordion — first item expanded — desktop",
      url: "/faq",
      viewport: { width: 1280, height: 800 },
      steps: [
        { action: "click", selector: "details summary" },
        { action: "wait", ms: 300 },
      ],
      severityThreshold: "medium",
    },
    {
      label: "home — how it works section — desktop",
      url: "/",
      viewport: { width: 1280, height: 800 },
      steps: [
        { action: "wait", ms: 1000 },
        // Scroll "How it works" step cards into view
        { action: "scroll", selector: "text=How it works" },
        { action: "wait", ms: 400 },
      ],
      severityThreshold: "medium",
    },

    // ── Tablet breakpoint (768) ───────────────────────────────────────
    {
      label: "home — tablet",
      url: "/",
      viewport: { width: 768, height: 1024 },
      severityThreshold: "medium",
    },
    {
      label: "collections — tablet",
      url: "/collections",
      viewport: { width: 768, height: 1024 },
      severityThreshold: "medium",
      skipIssueIds: [49],
    },
    {
      label: "faq — tablet",
      url: "/faq",
      viewport: { width: 768, height: 1024 },
      severityThreshold: "medium",
    },
  ],

  // ── Chaos mode routes ─────────────────────────────────────────────
  // Claude autonomously explores each route, clicking wherever it finds
  // interesting UI elements. Falls back to /sitemap.xml if omitted.
  routes: [
    "/",
    "/collections",
    "/marketplace",
    "/upcoming",
    "/learn",
    "/about",
    "/faq",
    "/blog",
    "/contact",
    "/help",
    "/careers",
    "/shipping",
    "/dashboard",
    "/this-page-does-not-exist",
  ],
};

export default config;
