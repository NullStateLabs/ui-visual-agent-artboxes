/**
 * ─────────────────────────────────────────────────────────────────────────────
 * GITHUB ACTIONS — required Secrets / Variables
 * ─────────────────────────────────────────────────────────────────────────────
 * WEB_URL              (Variable)  Base URL of the public web app.
 *                                  e.g. https://app.artboxes.io
 *
 * ARTIST_URL           (Variable)  Base URL of the artist portal.
 *                                  e.g. https://artist.artboxes.io
 *
 * DEMO_COLLECTION_SLUG (Variable)  A published collection slug that exists in
 *                                  the target env, used for /collections/[slug].
 *                                  e.g. neon-genesis-vol-1
 *
 * DEMO_ARTIST_USERNAME (Variable)  A public artist username that exists in the
 *                                  target env, used for /artists/[username].
 *                                  e.g. pixel-sage
 *
 * DEMO_COLLECTION_ID   (Variable)  Collection UUID used in artist portal routes
 *                                  (/collections/[collectionId]).
 *                                  e.g. clxxxxxxxxxxxxxxxx
 *
 * DEMO_TOKEN_ID        (Variable)  A token id inside DEMO_COLLECTION_SLUG,
 *                                  used for /collections/[slug]/items/[tokenId].
 *                                  e.g. 42
 *
 * DEMO_PRIZE_ID        (Variable)  A prize id inside DEMO_COLLECTION_SLUG,
 *                                  used for /collections/[slug]/prizes/[prizeId].
 *                                  e.g. prize-abc123
 *
 * DEMO_TX_HASH         (Variable)  A valid tx hash for the receipts page.
 *                                  e.g. 0xabcdef…
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * FALSE-POSITIVE SKIP REGISTRY — globalSkipIssueIds
 * ─────────────────────────────────────────────────────────────────────────────
 * #7  — Auth-wall and 404 pages intentionally show large empty areas.
 *       The sign-in prompt IS the content; an empty-space flag is always wrong.
 *
 * #11 — Collection and artwork card titles are CSS-truncated with ellipsis.
 *       This is a deliberate layout constraint, not a text overflow bug.
 *
 * #12 — Brand typography uses sub-11px all-caps labels throughout
 *       (e.g. "WITHDRAWABLE BALANCE", "TOTAL EARNED"). These are intentional.
 *
 * #15 — Mixed text alignment exists by design: hero copy is centred, body
 *       content is left-aligned. The site is not a single-alignment document.
 *
 * #27 — Footer / nav social buttons (Discord, X, Instagram, GitHub) are
 *       icon-only. These platforms are universally recognisable; tooltips are
 *       considered unnecessary in the current brand direction.
 *
 * #32 — Marketplace filter dropdowns are narrower than the search bar.
 *       This is an intentional visual hierarchy choice, not a form-width bug.
 *
 * #34 — Mobile bottom navigation bar intentionally overlaps page content.
 *       The page has bottom padding to compensate; the overlap is by design.
 *
 * #36 — Active nav item uses the same visual weight as inactive items.
 *       Active state is indicated by a separate accent, not font/colour change.
 *
 * #39 — Sub-pixel icon/text misalignment is a browser rendering artefact
 *       that differs across devices; it is not a real layout bug.
 *
 * #43 — Modal backdrops use a semi-transparent scrim that may appear light
 *       on bright pages. This matches the brand design system intentionally.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { AgentConfig } from "./src/runner/types.js";

declare const process: { env: Record<string, string | undefined> };

const WEB_URL    = process.env.WEB_URL    ?? "https://demo.boxes.art";
const ARTIST_URL = process.env.ARTIST_URL ?? "https://artboxes-artist.vercel.app";

const DEMO_COLLECTION_SLUG = process.env.DEMO_COLLECTION_SLUG ?? "demo-collection";
const DEMO_ARTIST_USERNAME = process.env.DEMO_ARTIST_USERNAME ?? "demo-artist";
const DEMO_COLLECTION_ID   = process.env.DEMO_COLLECTION_ID   ?? "demo-collection-id";
const DEMO_TOKEN_ID        = process.env.DEMO_TOKEN_ID        ?? "1";
const DEMO_PRIZE_ID        = process.env.DEMO_PRIZE_ID        ?? "demo-prize-id";
const DEMO_TX_HASH         = process.env.DEMO_TX_HASH         ?? "0x0000000000000000000000000000000000000000000000000000000000000000";

const config: AgentConfig = {
  globalSkipIssueIds: [7, 8, 11, 12, 15, 27, 32, 34, 36, 39, 43, 49],

  scenarios: [

    // ── WEB / HOME ───────────────────────────────────────────────────────────

    {
      label: "web / home — desktop",
      url: `${WEB_URL}/`,
      filePath: "apps/web/app/page.tsx",
      viewport: { width: 1280, height: 800 },
      skipIssueIds: [
        20, // hero images loaded from CDN; may not resolve at screenshot time
        22, // hero image intentionally fills viewport and clips at scroll fold
      ],
    },
    {
      label: "web / home — mobile",
      url: `${WEB_URL}/`,
      filePath: "apps/web/app/page.tsx",
      viewport: { width: 375, height: 812 },
      skipIssueIds: [
        20, // CDN hero images may be absent
        22, // hero clips at fold by design
      ],
    },

    // ── WEB / COLLECTIONS ────────────────────────────────────────────────────

    {
      label: "web / collections listing — desktop",
      url: `${WEB_URL}/collections`,
      filePath: "apps/web/app/collections/page.tsx",
      viewport: { width: 1280, height: 800 },
      skipIssueIds: [
        20, // collection cover art served from CDN
        49, // empty state when no collections are published yet
      ],
    },
    {
      label: "web / collections listing — mobile",
      url: `${WEB_URL}/collections`,
      filePath: "apps/web/app/collections/page.tsx",
      viewport: { width: 375, height: 812 },
      skipIssueIds: [20, 49],
    },

    {
      label: "web / collection detail — desktop",
      url: `${WEB_URL}/collections/${DEMO_COLLECTION_SLUG}`,
      filePath: "apps/web/app/collections/[slug]/page.tsx",
      viewport: { width: 1280, height: 800 },
      skipIssueIds: [
        20, // artwork images from CDN
        22, // artwork grid clips at scroll fold
        23, // skeleton while collection data loads
      ],
    },
    {
      label: "web / collection detail — mobile",
      url: `${WEB_URL}/collections/${DEMO_COLLECTION_SLUG}`,
      filePath: "apps/web/app/collections/[slug]/page.tsx",
      viewport: { width: 375, height: 812 },
      skipIssueIds: [20, 22, 23],
    },

    {
      label: "web / collection marketplace — desktop",
      url: `${WEB_URL}/collections/${DEMO_COLLECTION_SLUG}/marketplace`,
      filePath: "apps/web/app/collections/[slug]/marketplace/page.tsx",
      viewport: { width: 1280, height: 800 },
      skipIssueIds: [
        20, // item images from CDN
        49, // empty state when no listings exist yet
      ],
    },
    {
      label: "web / collection marketplace — mobile",
      url: `${WEB_URL}/collections/${DEMO_COLLECTION_SLUG}/marketplace`,
      filePath: "apps/web/app/collections/[slug]/marketplace/page.tsx",
      viewport: { width: 375, height: 812 },
      skipIssueIds: [20, 49],
    },

    // Modal: Place offer — OfferBookPanel on the collection marketplace page
    {
      label: "web / collection marketplace — PlaceOfferModal open (desktop)",
      url: `${WEB_URL}/collections/${DEMO_COLLECTION_SLUG}/marketplace`,
      filePath: "apps/web/components/marketplace/PlaceOfferModal.tsx",
      viewport: { width: 1280, height: 800 },
      steps: [
        { action: "click", selector: "button:has-text('Place offer')" },
        { action: "wait", ms: 600 },
      ],
      skipIssueIds: [
        10, // background marketplace content visible through modal overlay
        49, // no listing data visible behind the modal
      ],
    },

    {
      label: "web / collection private sale — desktop",
      url: `${WEB_URL}/collections/${DEMO_COLLECTION_SLUG}/private`,
      filePath: "apps/web/app/collections/[slug]/private/page.tsx",
      viewport: { width: 1280, height: 800 },
      skipIssueIds: [
        8,  // empty container if the private sale has no allowlist entries yet
        49, // no-content state is valid before any buyers are invited
      ],
    },

    {
      label: "web / collection prize detail — mobile",
      url: `${WEB_URL}/collections/${DEMO_COLLECTION_SLUG}/prizes/${DEMO_PRIZE_ID}`,
      filePath: "apps/web/app/collections/[slug]/prizes/[prizeId]/page.tsx",
      viewport: { width: 375, height: 812 },
      skipIssueIds: [
        20, // prize artwork from CDN
        49, // empty state if prize has no data in target env
      ],
    },

    {
      label: "web / item detail — desktop",
      url: `${WEB_URL}/collections/${DEMO_COLLECTION_SLUG}/items/${DEMO_TOKEN_ID}`,
      filePath: "apps/web/app/collections/[slug]/items/[tokenId]/page.tsx",
      viewport: { width: 1280, height: 800 },
      skipIssueIds: [
        20, // item artwork from CDN
        22, // artwork may clip at certain aspect ratios in the image container
        23, // skeleton while item metadata loads from chain
      ],
    },
    {
      label: "web / item detail — mobile",
      url: `${WEB_URL}/collections/${DEMO_COLLECTION_SLUG}/items/${DEMO_TOKEN_ID}`,
      filePath: "apps/web/app/collections/[slug]/items/[tokenId]/page.tsx",
      viewport: { width: 375, height: 812 },
      skipIssueIds: [20, 22, 23],
    },

    // ── WEB / MARKETPLACE ────────────────────────────────────────────────────

    {
      label: "web / marketplace — desktop",
      url: `${WEB_URL}/marketplace`,
      filePath: "apps/web/app/marketplace/page.tsx",
      viewport: { width: 1280, height: 800 },
      skipIssueIds: [
        20, // listing artwork from CDN
        49, // empty state when no secondary listings exist
      ],
    },
    {
      label: "web / marketplace — mobile",
      url: `${WEB_URL}/marketplace`,
      filePath: "apps/web/app/marketplace/page.tsx",
      viewport: { width: 375, height: 812 },
      skipIssueIds: [20, 49],
    },

    // ── WEB / UPCOMING ───────────────────────────────────────────────────────

    {
      label: "web / upcoming — desktop",
      url: `${WEB_URL}/upcoming`,
      filePath: "apps/web/app/upcoming/page.tsx",
      viewport: { width: 1280, height: 800 },
      skipIssueIds: [
        20, // upcoming collection cover art from CDN
        49, // empty state if no upcoming drops are scheduled
      ],
    },
    {
      label: "web / upcoming — mobile",
      url: `${WEB_URL}/upcoming`,
      filePath: "apps/web/app/upcoming/page.tsx",
      viewport: { width: 375, height: 812 },
      skipIssueIds: [20, 49],
    },

    // ── WEB / ARTIST PROFILE ─────────────────────────────────────────────────

    {
      label: "web / artist profile — desktop",
      url: `${WEB_URL}/artists/${DEMO_ARTIST_USERNAME}`,
      filePath: "apps/web/app/artists/[username]/page.tsx",
      viewport: { width: 1280, height: 800 },
      skipIssueIds: [
        20, // avatar / banner images from CDN
        49, // empty state if artist has no published collections
      ],
    },
    {
      label: "web / artist profile — mobile",
      url: `${WEB_URL}/artists/${DEMO_ARTIST_USERNAME}`,
      filePath: "apps/web/app/artists/[username]/page.tsx",
      viewport: { width: 375, height: 812 },
      skipIssueIds: [20, 49],
    },

    // ── WEB / AUTH-REQUIRED PAGES ────────────────────────────────────────────

    {
      label: "web / dashboard (auth wall) — desktop",
      url: `${WEB_URL}/dashboard`,
      filePath: "apps/web/app/dashboard/page.tsx",
      viewport: { width: 1280, height: 800 },
      skipIssueIds: [
        8,  // sign-in wall renders as an empty container by design
        49, // no inventory shown until wallet is connected
      ],
    },
    {
      label: "web / dashboard (auth wall) — mobile",
      url: `${WEB_URL}/dashboard`,
      filePath: "apps/web/app/dashboard/page.tsx",
      viewport: { width: 375, height: 812 },
      skipIssueIds: [8, 49],
    },

    {
      label: "web / profile (auth wall) — mobile",
      url: `${WEB_URL}/profile`,
      filePath: "apps/web/app/profile/page.tsx",
      viewport: { width: 375, height: 812 },
      skipIssueIds: [8, 49],
    },

    {
      label: "web / wallet (auth wall) — mobile",
      url: `${WEB_URL}/wallet`,
      filePath: "apps/web/app/wallet/page.tsx",
      viewport: { width: 375, height: 812 },
      skipIssueIds: [8, 49],
    },

    {
      label: "web / history (auth wall) — mobile",
      url: `${WEB_URL}/history`,
      filePath: "apps/web/app/history/page.tsx",
      viewport: { width: 375, height: 812 },
      skipIssueIds: [8, 49],
    },

    {
      label: "web / shipping (auth wall) — mobile",
      url: `${WEB_URL}/shipping`,
      filePath: "apps/web/app/shipping/page.tsx",
      viewport: { width: 375, height: 812 },
      skipIssueIds: [8, 49],
    },

    // ── WEB / RECEIPT ────────────────────────────────────────────────────────

    {
      label: "web / receipt — mobile",
      url: `${WEB_URL}/receipts/${DEMO_TX_HASH}`,
      filePath: "apps/web/app/receipts/[txHash]/page.tsx",
      viewport: { width: 375, height: 812 },
      skipIssueIds: [
        8,  // empty container if tx hash resolves to no data in target env
        49, // no receipt content until tx is confirmed on-chain
      ],
    },

    // ── WEB / BLOG ───────────────────────────────────────────────────────────

    {
      label: "web / blog listing — desktop",
      url: `${WEB_URL}/blog`,
      filePath: "apps/web/app/blog/page.tsx",
      viewport: { width: 1280, height: 800 },
      skipIssueIds: [49], // empty state if no posts are published yet
    },
    {
      label: "web / blog listing — mobile",
      url: `${WEB_URL}/blog`,
      filePath: "apps/web/app/blog/page.tsx",
      viewport: { width: 375, height: 812 },
      skipIssueIds: [49],
    },

    {
      label: "web / blog post — mobile",
      url: `${WEB_URL}/blog/1`,
      filePath: "apps/web/app/blog/[id]/page.tsx",
      viewport: { width: 375, height: 812 },
      skipIssueIds: [
        8,  // empty if post id doesn't exist in target env
        20, // post inline images from CDN
      ],
    },

    // ── WEB / FAQ ────────────────────────────────────────────────────────────

    {
      label: "web / faq — desktop",
      url: `${WEB_URL}/faq`,
      filePath: "apps/web/app/faq/page.tsx",
      viewport: { width: 1280, height: 800 },
      skipIssueIds: [46], // accordion chevrons are icon-only by design
    },
    {
      label: "web / faq — mobile",
      url: `${WEB_URL}/faq`,
      filePath: "apps/web/app/faq/page.tsx",
      viewport: { width: 375, height: 812 },
      skipIssueIds: [46],
    },

    // ── WEB / INFORMATIONAL / LEGAL PAGES ───────────────────────────────────

    {
      label: "web / about — mobile",
      url: `${WEB_URL}/about`,
      filePath: "apps/web/app/about/page.tsx",
      viewport: { width: 375, height: 812 },
    },
    {
      label: "web / careers — mobile",
      url: `${WEB_URL}/careers`,
      filePath: "apps/web/app/careers/page.tsx",
      viewport: { width: 375, height: 812 },
    },
    {
      label: "web / contact — mobile",
      url: `${WEB_URL}/contact`,
      filePath: "apps/web/app/contact/page.tsx",
      viewport: { width: 375, height: 812 },
    },
    {
      label: "web / learn — mobile",
      url: `${WEB_URL}/learn`,
      filePath: "apps/web/app/learn/page.tsx",
      viewport: { width: 375, height: 812 },
    },
    {
      label: "web / help — mobile",
      url: `${WEB_URL}/help`,
      filePath: "apps/web/app/help/page.tsx",
      viewport: { width: 375, height: 812 },
    },
    {
      label: "web / developers — mobile",
      url: `${WEB_URL}/developers`,
      filePath: "apps/web/app/developers/page.tsx",
      viewport: { width: 375, height: 812 },
      severityThreshold: "medium", // page is actively evolving
    },
    {
      label: "web / docs — mobile",
      url: `${WEB_URL}/docs`,
      filePath: "apps/web/app/docs/page.tsx",
      viewport: { width: 375, height: 812 },
      severityThreshold: "medium", // docs are actively evolving
    },
    {
      label: "web / privacy — mobile",
      url: `${WEB_URL}/privacy`,
      filePath: "apps/web/app/privacy/page.tsx",
      viewport: { width: 375, height: 812 },
    },
    {
      label: "web / terms — mobile",
      url: `${WEB_URL}/terms`,
      filePath: "apps/web/app/terms/page.tsx",
      viewport: { width: 375, height: 812 },
    },
    {
      label: "web / trademark — mobile",
      url: `${WEB_URL}/trademark`,
      filePath: "apps/web/app/trademark/page.tsx",
      viewport: { width: 375, height: 812 },
    },
    {
      label: "web / mailing-list unsubscribe — mobile",
      url: `${WEB_URL}/mailing-list/unsubscribe`,
      filePath: "apps/web/app/mailing-list/unsubscribe/page.tsx",
      viewport: { width: 375, height: 812 },
    },

    // ── WEB / 404 ────────────────────────────────────────────────────────────

    {
      label: "web / 404 — mobile",
      url: `${WEB_URL}/this-page-does-not-exist`,
      filePath: "apps/web/app/layout.tsx",
      viewport: { width: 375, height: 812 },
      skipIssueIds: [
        8,  // 404 body is intentionally sparse
        49, // no content is the expected 404 state
      ],
    },

    // ─────────────────────────────────────────────────────────────────────────
    // ARTIST APP
    // ─────────────────────────────────────────────────────────────────────────

    // ── ARTIST / HOME ────────────────────────────────────────────────────────

    {
      label: "artist / home (auth wall) — desktop",
      url: `${ARTIST_URL}/`,
      filePath: "apps/artist/app/page.tsx",
      viewport: { width: 1280, height: 800 },
      skipIssueIds: [
        8,  // sign-in prompt renders as an empty container until wallet connected
        49, // no dashboard data before auth
      ],
    },
    {
      label: "artist / home (auth wall) — mobile",
      url: `${ARTIST_URL}/`,
      filePath: "apps/artist/app/page.tsx",
      viewport: { width: 375, height: 812 },
      skipIssueIds: [8, 49],
    },

    // ── ARTIST / DASHBOARD ───────────────────────────────────────────────────

    {
      label: "artist / dashboard — desktop",
      url: `${ARTIST_URL}/dashboard`,
      filePath: "apps/artist/app/dashboard/page.tsx",
      viewport: { width: 1280, height: 800 },
      skipIssueIds: [49], // empty state when artist has no collections yet
    },
    {
      label: "artist / dashboard — mobile",
      url: `${ARTIST_URL}/dashboard`,
      filePath: "apps/artist/app/dashboard/page.tsx",
      viewport: { width: 375, height: 812 },
      skipIssueIds: [49],
    },

    // ── ARTIST / NEW COLLECTION ──────────────────────────────────────────────

    {
      label: "artist / new collection — desktop",
      url: `${ARTIST_URL}/collections/new`,
      filePath: "apps/artist/app/collections/new/page.tsx",
      viewport: { width: 1280, height: 800 },
      severityThreshold: "medium", // form under active development
      skipIssueIds: [
        8, // some form sections are conditionally empty on first load
      ],
    },
    {
      label: "artist / new collection — mobile",
      url: `${ARTIST_URL}/collections/new`,
      filePath: "apps/artist/app/collections/new/page.tsx",
      viewport: { width: 375, height: 812 },
      severityThreshold: "medium",
      skipIssueIds: [8],
    },

    // ── ARTIST / COLLECTION DETAIL ───────────────────────────────────────────

    {
      label: "artist / collection detail — desktop",
      url: `${ARTIST_URL}/collections/${DEMO_COLLECTION_ID}`,
      filePath: "apps/artist/app/collections/[collectionId]/page.tsx",
      viewport: { width: 1280, height: 800 },
      skipIssueIds: [
        20, // collection artwork from CDN
        23, // skeleton while collection data loads
        49, // empty sections before collection has any data
      ],
    },
    {
      label: "artist / collection detail — mobile",
      url: `${ARTIST_URL}/collections/${DEMO_COLLECTION_ID}`,
      filePath: "apps/artist/app/collections/[collectionId]/page.tsx",
      viewport: { width: 375, height: 812 },
      skipIssueIds: [20, 23, 49],
    },

    // Modal: Cash Out — CollectionEarnings section on collection detail
    {
      label: "artist / collection detail — CashOutModal open (desktop)",
      url: `${ARTIST_URL}/collections/${DEMO_COLLECTION_ID}`,
      filePath: "apps/artist/components/shared/CashOutModal.tsx",
      viewport: { width: 1280, height: 800 },
      severityThreshold: "medium",
      steps: [
        { action: "click", selector: "button:has-text('Cash Out')" },
        { action: "wait", ms: 600 },
      ],
      skipIssueIds: [
        10, // collection detail page content visible behind modal
      ],
    },

    // Modal: Send Giveaway — GiveawaysSection on collection detail
    {
      label: "artist / collection detail — SendGiveawayModal open (desktop)",
      url: `${ARTIST_URL}/collections/${DEMO_COLLECTION_ID}`,
      filePath: "apps/artist/components/collections/detail/SendGiveawayModal.tsx",
      viewport: { width: 1280, height: 800 },
      severityThreshold: "medium",
      steps: [
        { action: "click", selector: "button:has-text('Send')" },
        { action: "wait", ms: 600 },
      ],
      skipIssueIds: [
        10, // page content behind modal
        49, // giveaway section may be empty before modal opens
      ],
    },

    // Modal: Add Allowlist User — PrivateSaleSection on collection detail
    {
      label: "artist / collection detail — AddAllowlistUserModal open (desktop)",
      url: `${ARTIST_URL}/collections/${DEMO_COLLECTION_ID}`,
      filePath: "apps/artist/components/collections/detail/AddAllowlistUserModal.tsx",
      viewport: { width: 1280, height: 800 },
      severityThreshold: "medium",
      steps: [
        { action: "click", selector: "button:has-text('Add')" },
        { action: "wait", ms: 600 },
      ],
      skipIssueIds: [
        10, // page content behind modal
      ],
    },

    // ── ARTIST / COLLECTION STUDIO ───────────────────────────────────────────

    {
      label: "artist / collection studio — desktop",
      url: `${ARTIST_URL}/collections/${DEMO_COLLECTION_ID}/studio`,
      filePath: "apps/artist/app/collections/[collectionId]/studio/page.tsx",
      viewport: { width: 1280, height: 800 },
      severityThreshold: "medium", // studio is actively developed
      skipIssueIds: [
        20, // artwork from CDN
        23, // skeleton while studio data loads
        49, // empty state before any sale data exists
      ],
    },
    {
      label: "artist / collection studio — mobile",
      url: `${ARTIST_URL}/collections/${DEMO_COLLECTION_ID}/studio`,
      filePath: "apps/artist/app/collections/[collectionId]/studio/page.tsx",
      viewport: { width: 375, height: 812 },
      severityThreshold: "medium",
      skipIssueIds: [20, 23, 49],
    },

    // Modal: End Sale Early — LiveSaleControls on collection studio
    {
      label: "artist / collection studio — EndSaleEarlyModal open (desktop)",
      url: `${ARTIST_URL}/collections/${DEMO_COLLECTION_ID}/studio`,
      filePath: "apps/artist/components/collections/detail/EndSaleEarlyModal.tsx",
      viewport: { width: 1280, height: 800 },
      severityThreshold: "medium",
      steps: [
        { action: "click", selector: "button:has-text('End sale early')" },
        { action: "wait", ms: 600 },
      ],
      skipIssueIds: [
        10, // studio page content visible behind confirmation modal
      ],
    },

    // ── ARTIST / PRIZES ──────────────────────────────────────────────────────

    {
      label: "artist / new prize — desktop",
      url: `${ARTIST_URL}/collections/${DEMO_COLLECTION_ID}/prizes/new`,
      filePath: "apps/artist/app/collections/[collectionId]/prizes/new/page.tsx",
      viewport: { width: 1280, height: 800 },
      severityThreshold: "medium",
    },

    {
      label: "artist / consolation prize — desktop",
      url: `${ARTIST_URL}/collections/${DEMO_COLLECTION_ID}/prizes/consolation`,
      filePath: "apps/artist/app/collections/[collectionId]/prizes/consolation/page.tsx",
      viewport: { width: 1280, height: 800 },
      severityThreshold: "medium",
    },

    // ── ARTIST / EARNINGS ────────────────────────────────────────────────────

    {
      label: "artist / earnings — desktop",
      url: `${ARTIST_URL}/earnings`,
      filePath: "apps/artist/app/earnings/page.tsx",
      viewport: { width: 1280, height: 800 },
      skipIssueIds: [
        8,  // zero-balance sections render as empty containers before wallet connected
        49, // no earnings data before first sale
      ],
    },
    {
      label: "artist / earnings — mobile",
      url: `${ARTIST_URL}/earnings`,
      filePath: "apps/artist/app/earnings/page.tsx",
      viewport: { width: 375, height: 812 },
      skipIssueIds: [8, 49],
    },

    // Modal: Withdraw — EarningsPageClient on earnings page
    {
      label: "artist / earnings — WithdrawModal open (desktop)",
      url: `${ARTIST_URL}/earnings`,
      filePath: "apps/artist/components/earnings/WithdrawModal.tsx",
      viewport: { width: 1280, height: 800 },
      steps: [
        { action: "click", selector: "button:has-text('Withdraw')" },
        { action: "wait", ms: 600 },
      ],
      skipIssueIds: [
        10, // earnings page content visible behind modal
        49, // no withdrawable balance shown inside modal at zero-balance state
      ],
    },
    {
      label: "artist / earnings — WithdrawModal open (mobile)",
      url: `${ARTIST_URL}/earnings`,
      filePath: "apps/artist/components/earnings/WithdrawModal.tsx",
      viewport: { width: 375, height: 812 },
      steps: [
        { action: "click", selector: "button:has-text('Withdraw')" },
        { action: "wait", ms: 600 },
      ],
      skipIssueIds: [10, 49],
    },

    // ── ARTIST / REFERRALS ───────────────────────────────────────────────────

    {
      label: "artist / referrals — desktop",
      url: `${ARTIST_URL}/referrals`,
      filePath: "apps/artist/app/referrals/page.tsx",
      viewport: { width: 1280, height: 800 },
      skipIssueIds: [
        8,  // invite link section empty before wallet connected
        49, // referral table empty if no referrals yet
      ],
    },
    {
      label: "artist / referrals — mobile",
      url: `${ARTIST_URL}/referrals`,
      filePath: "apps/artist/app/referrals/page.tsx",
      viewport: { width: 375, height: 812 },
      skipIssueIds: [8, 49],
    },

    // ── ARTIST / CLAIMS ──────────────────────────────────────────────────────

    {
      label: "artist / claims — desktop",
      url: `${ARTIST_URL}/claims`,
      filePath: "apps/artist/app/claims/page.tsx",
      viewport: { width: 1280, height: 800 },
      skipIssueIds: [49], // empty state when no claims have been submitted
    },
    {
      label: "artist / claims — mobile",
      url: `${ARTIST_URL}/claims`,
      filePath: "apps/artist/app/claims/page.tsx",
      viewport: { width: 375, height: 812 },
      skipIssueIds: [49],
    },

    // ── ARTIST / ADMIN ───────────────────────────────────────────────────────

    {
      label: "artist / moderation — mobile",
      url: `${ARTIST_URL}/moderation`,
      filePath: "apps/artist/app/moderation/page.tsx",
      viewport: { width: 375, height: 812 },
      skipIssueIds: [
        8,  // empty container if no items require moderation
        49, // no moderation queue entries
      ],
    },

    {
      label: "artist / ops — mobile",
      url: `${ARTIST_URL}/ops`,
      filePath: "apps/artist/app/ops/page.tsx",
      viewport: { width: 375, height: 812 },
      skipIssueIds: [8, 49],
    },

    // Modal: Add Socials — ProfileMenu in header (present on all authenticated pages)
    {
      label: "artist / header — AddSocialsModal open (desktop)",
      url: `${ARTIST_URL}/dashboard`,
      filePath: "apps/artist/components/socials/AddSocialsModal.tsx",
      viewport: { width: 1280, height: 800 },
      steps: [
        { action: "click", selector: "button:has-text('Link socials'), button:has-text('Add socials')" },
        { action: "wait", ms: 600 },
      ],
      skipIssueIds: [
        10, // dashboard content visible behind modal
        49, // dashboard may show no collections behind overlay
      ],
    },

    // ── ARTIST / LEGAL ───────────────────────────────────────────────────────

    {
      label: "artist / privacy — mobile",
      url: `${ARTIST_URL}/privacy`,
      filePath: "apps/artist/app/privacy/page.tsx",
      viewport: { width: 375, height: 812 },
    },
    {
      label: "artist / terms — mobile",
      url: `${ARTIST_URL}/terms`,
      filePath: "apps/artist/app/terms/page.tsx",
      viewport: { width: 375, height: 812 },
    },

  ],

  // Most interactive routes across both apps for the chaos runner
  routes: [
    `${WEB_URL}/`,
    `${WEB_URL}/collections`,
    `${WEB_URL}/marketplace`,
    `${WEB_URL}/collections/${DEMO_COLLECTION_SLUG}/marketplace`,
    `${WEB_URL}/collections/${DEMO_COLLECTION_SLUG}/items/${DEMO_TOKEN_ID}`,
    `${WEB_URL}/dashboard`,
    `${ARTIST_URL}/collections/${DEMO_COLLECTION_ID}/studio`,
    `${ARTIST_URL}/collections/new`,
    `${ARTIST_URL}/earnings`,
    `${ARTIST_URL}/referrals`,
  ],
};

export default config;
