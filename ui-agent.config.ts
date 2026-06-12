import type { AgentConfig } from "./src/runner/types.js";

declare const process: { env: Record<string, string | undefined> };


const WEB_URL    = process.env.WEB_URL    ?? "https://demo.boxes.art";
const ARTIST_URL = process.env.ARTIST_URL ?? "https://artboxes-artist.vercel.app";

const config: AgentConfig = {
  scenarios: [
    // ── WEB APP ───────────────────────────────────────────────────────────────

    {
      label: "Web / Home — mobile",
      url: `${WEB_URL}`,
      filePath: "apps/web/app/page.tsx",
      viewport: { width: 375, height: 812 },
    },
    {
      label: "Web / Home — desktop",
      url: `${WEB_URL}`,
      filePath: "apps/web/app/page.tsx",
      viewport: { width: 1280, height: 800 },
    },

    {
      label: "Web / Collections — mobile",
      url: `${WEB_URL}/collections`,
      filePath: "apps/web/app/collections/page.tsx",
      viewport: { width: 375, height: 812 },
    },
    {
      label: "Web / Collections — desktop",
      url: `${WEB_URL}/collections`,
      filePath: "apps/web/app/collections/page.tsx",
      viewport: { width: 1280, height: 800 },
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
    },

    // Marketplace — unauthenticated shows a Privy sign-in wall; empty container is intentional (#8)
    {
      label: "Web / Marketplace — mobile (unauthed)",
      url: `${WEB_URL}/marketplace`,
      filePath: "apps/web/app/marketplace/page.tsx",
      viewport: { width: 375, height: 812 },
      skipIssueIds: [8],
    },
    {
      label: "Web / Marketplace — desktop (unauthed)",
      url: `${WEB_URL}/marketplace`,
      filePath: "apps/web/app/marketplace/page.tsx",
      viewport: { width: 1280, height: 800 },
      skipIssueIds: [8],
    },

    // Auth-required buyer pages — all render a Privy sign-in wall (#8 intentional)
    {
      label: "Web / Dashboard — mobile (unauthed)",
      url: `${WEB_URL}/dashboard`,
      filePath: "apps/web/app/dashboard/page.tsx",
      viewport: { width: 375, height: 812 },
      skipIssueIds: [8],
    },
    {
      label: "Web / Dashboard — desktop (unauthed)",
      url: `${WEB_URL}/dashboard`,
      filePath: "apps/web/app/dashboard/page.tsx",
      viewport: { width: 1280, height: 800 },
      skipIssueIds: [8],
    },
    {
      label: "Web / Profile — mobile (unauthed)",
      url: `${WEB_URL}/profile`,
      filePath: "apps/web/app/profile/page.tsx",
      viewport: { width: 375, height: 812 },
      skipIssueIds: [8],
    },
    {
      label: "Web / Wallet — mobile (unauthed)",
      url: `${WEB_URL}/wallet`,
      filePath: "apps/web/app/wallet/page.tsx",
      viewport: { width: 375, height: 812 },
      skipIssueIds: [8],
    },
    {
      label: "Web / History — mobile (unauthed)",
      url: `${WEB_URL}/history`,
      filePath: "apps/web/app/history/page.tsx",
      viewport: { width: 375, height: 812 },
      skipIssueIds: [8],
    },
    {
      label: "Web / Shipping — mobile (unauthed)",
      url: `${WEB_URL}/shipping`,
      filePath: "apps/web/app/shipping/page.tsx",
      viewport: { width: 375, height: 812 },
      skipIssueIds: [8],
    },

    // FAQ — accordion toggles are icon-only chevrons by design (#46)
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
    },

    // Simple / text-only pages — mobile viewport only
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
    // Docs / Developers are actively evolving — medium threshold acceptable
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
    {
      label: "Web / Trademark — mobile",
      url: `${WEB_URL}/trademark`,
      filePath: "apps/web/app/trademark/page.tsx",
      viewport: { width: 375, height: 812 },
    },
    {
      label: "Web / Unsubscribe — mobile",
      url: `${WEB_URL}/mailing-list/unsubscribe`,
      filePath: "apps/web/app/mailing-list/unsubscribe/page.tsx",
      viewport: { width: 375, height: 812 },
    },

    // ── WEB APP MODALS ────────────────────────────────────────────────────────

    // PlaceOfferModal — launched from marketplace; Privy may intercept (#8)
    {
      label: "Web / PlaceOfferModal — mobile",
      url: `${WEB_URL}/marketplace`,
      filePath: "apps/web/components/marketplace/PlaceOfferModal.tsx",
      viewport: { width: 375, height: 812 },
      steps: [
        { action: "click", selector: "button:has-text('Place offer')" },
        { action: "wait", ms: 600 },
      ],
      skipIssueIds: [8],
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
      skipIssueIds: [8],
    },

    // ── ARTIST APP ────────────────────────────────────────────────────────────

    {
      label: "Artist / Home — mobile",
      url: `${ARTIST_URL}`,
      filePath: "apps/artist/app/page.tsx",
      viewport: { width: 375, height: 812 },
    },
    {
      label: "Artist / Home — desktop",
      url: `${ARTIST_URL}`,
      filePath: "apps/artist/app/page.tsx",
      viewport: { width: 1280, height: 800 },
    },

    // Auth-required artist pages — all render a Privy sign-in wall (#8 intentional)
    {
      label: "Artist / Dashboard — mobile (unauthed)",
      url: `${ARTIST_URL}/dashboard`,
      filePath: "apps/artist/app/dashboard/page.tsx",
      viewport: { width: 375, height: 812 },
      skipIssueIds: [8],
    },
    {
      label: "Artist / Dashboard — desktop (unauthed)",
      url: `${ARTIST_URL}/dashboard`,
      filePath: "apps/artist/app/dashboard/page.tsx",
      viewport: { width: 1280, height: 800 },
      skipIssueIds: [8],
    },
    {
      label: "Artist / Earnings — mobile (unauthed)",
      url: `${ARTIST_URL}/earnings`,
      filePath: "apps/artist/app/earnings/page.tsx",
      viewport: { width: 375, height: 812 },
      skipIssueIds: [8],
    },
    {
      label: "Artist / Earnings — desktop (unauthed)",
      url: `${ARTIST_URL}/earnings`,
      filePath: "apps/artist/app/earnings/page.tsx",
      viewport: { width: 1280, height: 800 },
      skipIssueIds: [8],
    },
    {
      label: "Artist / Claims — mobile (unauthed)",
      url: `${ARTIST_URL}/claims`,
      filePath: "apps/artist/app/claims/page.tsx",
      viewport: { width: 375, height: 812 },
      skipIssueIds: [8],
    },
    {
      label: "Artist / Referrals — mobile (unauthed)",
      url: `${ARTIST_URL}/referrals`,
      filePath: "apps/artist/app/referrals/page.tsx",
      viewport: { width: 375, height: 812 },
      skipIssueIds: [8],
    },

    {
      label: "Artist / Privacy — mobile",
      url: `${ARTIST_URL}/privacy`,
      filePath: "apps/artist/app/privacy/page.tsx",
      viewport: { width: 375, height: 812 },
    },
    {
      label: "Artist / Terms — mobile",
      url: `${ARTIST_URL}/terms`,
      filePath: "apps/artist/app/terms/page.tsx",
      viewport: { width: 375, height: 812 },
    },

    // ── ARTIST APP MODALS ─────────────────────────────────────────────────────

    // AddSocialsModal — button lives on the artist dashboard; Privy intercepts (#8)
    {
      label: "Artist / AddSocialsModal — mobile",
      url: `${ARTIST_URL}/dashboard`,
      filePath: "apps/artist/components/socials/AddSocialsModal.tsx",
      viewport: { width: 375, height: 812 },
      steps: [
        { action: "click", selector: "button:has-text('Add socials')" },
        { action: "wait", ms: 600 },
      ],
      skipIssueIds: [8],
    },

    // WithdrawModal — triggered from earnings page; Privy intercepts (#8)
    {
      label: "Artist / WithdrawModal — mobile",
      url: `${ARTIST_URL}/earnings`,
      filePath: "apps/artist/components/earnings/WithdrawModal.tsx",
      viewport: { width: 375, height: 812 },
      steps: [
        { action: "click", selector: "button:has-text('Withdraw')" },
        { action: "wait", ms: 600 },
      ],
      skipIssueIds: [8],
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
      skipIssueIds: [8],
    },

  ],

  // ── CHAOS ROUTES ───────────────────────────────────────────────────────────
  // Most interactive pages across both apps. The chaos runner clicks
  // anything that looks interactive and flags unexpected states.
  routes: [
    `${WEB_URL}`,                   // Web home — nav, hero CTA
    `${WEB_URL}/collections`,       // Collection grid + filters
    `${WEB_URL}/marketplace`,       // Offer flows, listing cards
    `${WEB_URL}/faq`,               // Accordion interactions
    `${WEB_URL}/blog`,              // Cards, pagination
    `${ARTIST_URL}`,                // Artist landing — sign-up CTA
    `${ARTIST_URL}/dashboard`,      // Auth wall + dashboard CTAs
  ],
};

export default config;
