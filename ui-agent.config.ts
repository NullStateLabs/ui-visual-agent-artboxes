/**
 * Artboxes ui-agent config
 *
 * Required env vars (add to GitHub Actions secrets/variables):
 *   WEB_URL     — e.g. https://artboxes.io           (web app)
 *   ARTIST_URL  — e.g. https://artist.artboxes.io    (artist portal)
 *
 * Locally: add to .env (falls back to localhost defaults if unset)
 */
import type { AgentConfig } from "./src/runner/types.js";

const WEB_URL    = process.env.WEB_URL    ?? "http://localhost:3000";
const ARTIST_URL = process.env.ARTIST_URL ?? "http://localhost:3001";

const config: AgentConfig = {
  scenarios: [
    // ── WEB APP ──────────────────────────────────────────────────────────────

    {
      label: "Web / Home — mobile",
      url: `${WEB_URL}/`,
      filePath: "apps/web/app/page.tsx",
      viewport: { width: 375, height: 812 },
    },
    {
      label: "Web / Home — desktop",
      url: `${WEB_URL}/`,
      filePath: "apps/web/app/page.tsx",
      viewport: { width: 1280, height: 800 },
    },

    {
      label: "Web / Collections — mobile",
      url: `${WEB_URL}/collections`,
      filePath: "apps/web/app/collections/page.tsx",
      viewport: { width: 375, height: 812 },
      // skeleton cards during data fetch look like empty boxes (#23, #49, #50) — intentional loading state
      skipIssueIds: [23, 49, 50],
    },
    {
      label: "Web / Collections — desktop",
      url: `${WEB_URL}/collections`,
      filePath: "apps/web/app/collections/page.tsx",
      viewport: { width: 1280, height: 800 },
      skipIssueIds: [8, 23, 49, 50],
    },

    {
      label: "Web / Upcoming — mobile",
      url: `${WEB_URL}/upcoming`,
      filePath: "apps/web/app/upcoming/page.tsx",
      viewport: { width: 375, height: 812 },
    },
    {
      label: "Web / Upcoming — desktop",
      url: `${WEB_URL}/upcoming`,
      filePath: "apps/web/app/upcoming/page.tsx",
      viewport: { width: 1280, height: 800 },
      // gradient placeholder cards while CDN images load — not a layout bug
      skipIssueIds: [23],
    },

    // Marketplace — unauthenticated shows a sign-in wall; empty container + no empty-state msg is intentional (#8, #49)
    {
      label: "Web / Marketplace — mobile (unauthed)",
      url: `${WEB_URL}/marketplace`,
      filePath: "apps/web/app/marketplace/page.tsx",
      viewport: { width: 375, height: 812 },
      skipIssueIds: [8, 49],
    },
    {
      label: "Web / Marketplace — desktop (unauthed)",
      url: `${WEB_URL}/marketplace`,
      filePath: "apps/web/app/marketplace/page.tsx",
      viewport: { width: 1280, height: 800 },
      skipIssueIds: [8, 49],
    },

    // Auth-required pages — all render a Privy sign-in wall when unauthenticated (#8, #49)
    {
      label: "Web / Dashboard — mobile (unauthed)",
      url: `${WEB_URL}/dashboard`,
      filePath: "apps/web/app/dashboard/page.tsx",
      viewport: { width: 375, height: 812 },
      skipIssueIds: [8, 49],
    },
    {
      label: "Web / Dashboard — desktop (unauthed)",
      url: `${WEB_URL}/dashboard`,
      filePath: "apps/web/app/dashboard/page.tsx",
      viewport: { width: 1280, height: 800 },
      skipIssueIds: [8, 49],
    },
    {
      label: "Web / Profile — mobile (unauthed)",
      url: `${WEB_URL}/profile`,
      filePath: "apps/web/app/profile/page.tsx",
      viewport: { width: 375, height: 812 },
      skipIssueIds: [8, 49],
    },
    {
      label: "Web / Wallet — mobile (unauthed)",
      url: `${WEB_URL}/wallet`,
      filePath: "apps/web/app/wallet/page.tsx",
      viewport: { width: 375, height: 812 },
      skipIssueIds: [8, 49],
    },
    {
      label: "Web / History — mobile (unauthed)",
      url: `${WEB_URL}/history`,
      filePath: "apps/web/app/history/page.tsx",
      viewport: { width: 375, height: 812 },
      skipIssueIds: [8, 49],
    },
    {
      label: "Web / Shipping — mobile (unauthed)",
      url: `${WEB_URL}/shipping`,
      filePath: "apps/web/app/shipping/page.tsx",
      viewport: { width: 375, height: 812 },
      skipIssueIds: [8, 49],
    },

    // FAQ — accordion toggles are icon-only by design (#46)
    {
      label: "Web / FAQ — mobile",
      url: `${WEB_URL}/faq`,
      filePath: "apps/web/app/faq/page.tsx",
      viewport: { width: 375, height: 812 },
      skipIssueIds: [46],
    },
    {
      label: "Web / FAQ — desktop",
      url: `${WEB_URL}/faq`,
      filePath: "apps/web/app/faq/page.tsx",
      viewport: { width: 1280, height: 800 },
      skipIssueIds: [46],
    },

    {
      label: "Web / Blog — mobile",
      url: `${WEB_URL}/blog`,
      filePath: "apps/web/app/blog/page.tsx",
      viewport: { width: 375, height: 812 },
    },
    {
      label: "Web / Blog — desktop",
      url: `${WEB_URL}/blog`,
      filePath: "apps/web/app/blog/page.tsx",
      viewport: { width: 1280, height: 800 },
      // sparse grid with few articles is expected content, not a layout bug
      skipIssueIds: [8],
    },

    // Simple / text-only pages — mobile only
    {
      label: "Web / About — mobile",
      url: `${WEB_URL}/about`,
      filePath: "apps/web/app/about/page.tsx",
      viewport: { width: 375, height: 812 },
    },
    {
      label: "Web / Careers — mobile",
      url: `${WEB_URL}/careers`,
      filePath: "apps/web/app/careers/page.tsx",
      viewport: { width: 375, height: 812 },
    },
    {
      label: "Web / Contact — mobile",
      url: `${WEB_URL}/contact`,
      filePath: "apps/web/app/contact/page.tsx",
      viewport: { width: 375, height: 812 },
      // section below fold looks empty in screenshot but content exists further down
      skipIssueIds: [8],
    },
    {
      label: "Web / Learn — mobile",
      url: `${WEB_URL}/learn`,
      filePath: "apps/web/app/learn/page.tsx",
      viewport: { width: 375, height: 812 },
    },
    {
      label: "Web / Help — mobile",
      url: `${WEB_URL}/help`,
      filePath: "apps/web/app/help/page.tsx",
      viewport: { width: 375, height: 812 },
    },
    // Still under active development — medium threshold to reduce noise
    {
      label: "Web / Developers — mobile",
      url: `${WEB_URL}/developers`,
      filePath: "apps/web/app/developers/page.tsx",
      viewport: { width: 375, height: 812 },
      severityThreshold: "medium",
    },
    {
      label: "Web / Docs — mobile",
      url: `${WEB_URL}/docs`,
      filePath: "apps/web/app/docs/page.tsx",
      viewport: { width: 375, height: 812 },
      severityThreshold: "medium",
    },
    {
      label: "Web / Privacy — mobile",
      url: `${WEB_URL}/privacy`,
      filePath: "apps/web/app/privacy/page.tsx",
      viewport: { width: 375, height: 812 },
    },
    {
      label: "Web / Terms — mobile",
      url: `${WEB_URL}/terms`,
      filePath: "apps/web/app/terms/page.tsx",
      viewport: { width: 375, height: 812 },
    },

    // ── WEB APP — MODALS ─────────────────────────────────────────────────────

    {
      label: "Web / PlaceOfferModal — mobile",
      url: `${WEB_URL}/marketplace`,
      filePath: "apps/web/components/marketplace/PlaceOfferModal.tsx",
      viewport: { width: 375, height: 812 },
      steps: [
        { action: "click", selector: "button:has-text('Place offer')" },
        { action: "wait", ms: 600 },
      ],
      skipIssueIds: [8, 49],
    },
    {
      label: "Web / PlaceOfferModal — desktop",
      url: `${WEB_URL}/marketplace`,
      filePath: "apps/web/components/marketplace/PlaceOfferModal.tsx",
      viewport: { width: 1280, height: 800 },
      steps: [
        { action: "click", selector: "button:has-text('Place offer')" },
        { action: "wait", ms: 600 },
      ],
      // #36: active nav state on marketplace — real bug, let fix agent handle
      skipIssueIds: [8, 16, 49],
    },

    // ── ARTIST APP ───────────────────────────────────────────────────────────

    {
      label: "Artist / Home — mobile",
      url: `${ARTIST_URL}/`,
      filePath: "apps/artist/app/page.tsx",
      viewport: { width: 375, height: 812 },
    },
    {
      label: "Artist / Home — desktop",
      url: `${ARTIST_URL}/`,
      filePath: "apps/artist/app/page.tsx",
      viewport: { width: 1280, height: 800 },
    },

    // Auth-required artist pages (#8, #46, #49)
    {
      label: "Artist / Dashboard — mobile (unauthed)",
      url: `${ARTIST_URL}/dashboard`,
      filePath: "apps/artist/app/dashboard/page.tsx",
      viewport: { width: 375, height: 812 },
      skipIssueIds: [8, 46, 49],
    },
    {
      label: "Artist / Dashboard — desktop (unauthed)",
      url: `${ARTIST_URL}/dashboard`,
      filePath: "apps/artist/app/dashboard/page.tsx",
      viewport: { width: 1280, height: 800 },
      skipIssueIds: [8, 49],
    },
    {
      label: "Artist / Earnings — mobile (unauthed)",
      url: `${ARTIST_URL}/earnings`,
      filePath: "apps/artist/app/earnings/page.tsx",
      viewport: { width: 375, height: 812 },
      skipIssueIds: [8, 49],
    },
    {
      label: "Artist / Earnings — desktop (unauthed)",
      url: `${ARTIST_URL}/earnings`,
      filePath: "apps/artist/app/earnings/page.tsx",
      viewport: { width: 1280, height: 800 },
      skipIssueIds: [8, 49],
    },
    {
      label: "Artist / Claims — mobile (unauthed)",
      url: `${ARTIST_URL}/claims`,
      filePath: "apps/artist/app/claims/page.tsx",
      viewport: { width: 375, height: 812 },
      skipIssueIds: [8, 49],
    },
    {
      label: "Artist / Referrals — mobile (unauthed)",
      url: `${ARTIST_URL}/referrals`,
      filePath: "apps/artist/app/referrals/page.tsx",
      viewport: { width: 375, height: 812 },
      // #16: "Connect your studio wallet" placeholder is intentionally muted brand color
      skipIssueIds: [8, 16, 49],
    },

    {
      label: "Artist / Privacy — mobile",
      url: `${ARTIST_URL}/privacy`,
      filePath: "apps/artist/app/privacy/page.tsx",
      viewport: { width: 375, height: 812 },
      skipIssueIds: [46],
    },
    {
      label: "Artist / Terms — mobile",
      url: `${ARTIST_URL}/terms`,
      filePath: "apps/artist/app/terms/page.tsx",
      viewport: { width: 375, height: 812 },
      skipIssueIds: [46],
    },

    // ── ARTIST APP — MODALS ──────────────────────────────────────────────────

    {
      label: "Artist / AddSocialsModal — mobile",
      url: `${ARTIST_URL}/dashboard`,
      filePath: "apps/artist/components/socials/AddSocialsModal.tsx",
      viewport: { width: 375, height: 812 },
      steps: [
        { action: "click", selector: "button:has-text('Add socials')" },
        { action: "wait", ms: 600 },
      ],
      skipIssueIds: [8, 46, 49],
    },
    {
      label: "Artist / WithdrawModal — mobile",
      url: `${ARTIST_URL}/earnings`,
      filePath: "apps/artist/components/earnings/WithdrawModal.tsx",
      viewport: { width: 375, height: 812 },
      steps: [
        { action: "click", selector: "button:has-text('Withdraw')" },
        { action: "wait", ms: 600 },
      ],
      skipIssueIds: [8, 49],
    },
    {
      label: "Artist / WithdrawModal — desktop",
      url: `${ARTIST_URL}/earnings`,
      filePath: "apps/artist/components/earnings/WithdrawModal.tsx",
      viewport: { width: 1280, height: 800 },
      steps: [
        { action: "click", selector: "button:has-text('Withdraw')" },
        { action: "wait", ms: 600 },
      ],
      skipIssueIds: [8, 49],
    },

    // ── WEB APP — INTERACTIVE SCENARIOS ─────────────────────────────────────

    {
      label: "Web / 404 page — mobile",
      url: `${WEB_URL}/this-page-does-not-exist`,
      viewport: { width: 375, height: 812 },
      skipIssueIds: [49],
    },

    {
      label: "Web / Sign in modal — mobile",
      url: `${WEB_URL}/`,
      viewport: { width: 375, height: 812 },
      steps: [
        { action: "click", selector: "button:has-text('Sign In')" },
        { action: "wait", ms: 800 },
      ],
      skipIssueIds: [43],
    },
    {
      label: "Web / Sign in modal — desktop",
      url: `${WEB_URL}/`,
      viewport: { width: 1280, height: 800 },
      steps: [
        { action: "click", selector: "button:has-text('Sign In')" },
        { action: "wait", ms: 800 },
      ],
      skipIssueIds: [9],
    },

    {
      label: "Web / FAQ accordion — first item expanded — mobile",
      url: `${WEB_URL}/faq`,
      viewport: { width: 375, height: 812 },
      steps: [
        { action: "click", selector: "details summary" },
        { action: "wait", ms: 300 },
      ],
      skipIssueIds: [46],
    },
    {
      label: "Web / FAQ accordion — first item expanded — desktop",
      url: `${WEB_URL}/faq`,
      viewport: { width: 1280, height: 800 },
      steps: [
        { action: "click", selector: "details summary" },
        { action: "wait", ms: 300 },
      ],
      severityThreshold: "medium",
    },

    {
      label: "Web / Global search with query — desktop",
      url: `${WEB_URL}/`,
      viewport: { width: 1280, height: 800 },
      steps: [
        {
          action: "fill",
          selector: "input[placeholder='Search collections, artists…']",
          value: "art",
        },
        { action: "wait", ms: 700 },
      ],
      skipIssueIds: [3, 11],
    },

    {
      label: "Web / Home hero carousel — second page — mobile",
      url: `${WEB_URL}/`,
      viewport: { width: 375, height: 812 },
      steps: [
        { action: "wait", ms: 1500 },
        { action: "click", selector: "button[aria-label='Next collections']" },
        { action: "wait", ms: 600 },
      ],
    },
    {
      label: "Web / Home — how it works section — desktop",
      url: `${WEB_URL}/`,
      viewport: { width: 1280, height: 800 },
      steps: [
        { action: "wait", ms: 1000 },
        { action: "scroll", selector: "text=How it works" },
        { action: "wait", ms: 400 },
      ],
      severityThreshold: "medium",
    },

    {
      label: "Web / Collections search filter — mobile",
      url: `${WEB_URL}/collections`,
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

    // ── WEB APP — WIDE DESKTOP (1440) ─────────────────────────────────────────

    {
      label: "Web / Home — wide desktop",
      url: `${WEB_URL}/`,
      viewport: { width: 1440, height: 900 },
      severityThreshold: "medium",
    },
    {
      label: "Web / Collections — wide desktop",
      url: `${WEB_URL}/collections`,
      viewport: { width: 1440, height: 900 },
      severityThreshold: "medium",
      skipIssueIds: [49],
    },
    {
      label: "Web / Marketplace — wide desktop",
      url: `${WEB_URL}/marketplace`,
      viewport: { width: 1440, height: 900 },
      severityThreshold: "medium",
      skipIssueIds: [49, 11],
    },

    // ── WEB APP — TABLET (768) ────────────────────────────────────────────────

    {
      label: "Web / Home — tablet",
      url: `${WEB_URL}/`,
      viewport: { width: 768, height: 1024 },
      severityThreshold: "medium",
    },
    {
      label: "Web / Collections — tablet",
      url: `${WEB_URL}/collections`,
      viewport: { width: 768, height: 1024 },
      severityThreshold: "medium",
      skipIssueIds: [49],
    },
    {
      label: "Web / FAQ — tablet",
      url: `${WEB_URL}/faq`,
      viewport: { width: 768, height: 1024 },
      severityThreshold: "medium",
    },
  ],

  // ── CHAOS ROUTES ─────────────────────────────────────────────────────────
  routes: [
    `${WEB_URL}/`,
    `${WEB_URL}/collections`,
    `${WEB_URL}/marketplace`,
    `${WEB_URL}/faq`,
    `${WEB_URL}/blog`,
    `${ARTIST_URL}/`,
    `${ARTIST_URL}/dashboard`,
  ],
};

export default config;
