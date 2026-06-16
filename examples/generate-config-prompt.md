# Prompt: Generate ui-agent.config.ts for this project

Paste the prompt below into Claude **in the context of your target project**.
Claude will explore the codebase and generate a ready-to-use `ui-agent.config.ts`
that you copy to the repo root of `ui-visual-agent`.

A working reference config is at `examples/artboxes-config.ts`.

---

```
I'm connecting ui-visual-agent to this project — a pipeline that takes
Playwright screenshots, checks them against a UI checklist via Claude Vision,
and automatically opens CSS fix PRs.

Your task: analyse this project's structure and produce a complete
`ui-agent.config.ts`. Read the file tree, app router, and component dirs
before writing anything.

━━━ TYPE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

```ts
import type { AgentConfig } from "./src/runner/types.js";

interface Scenario {
  label: string;
  url: string;           // absolute URL built from env vars — never hardcoded
  filePath?: string;     // source file the fix agent will edit for this page
  steps?: StepAction[];  // click / fill / wait before the screenshot
  viewport?: { width: number; height: number };
  skipIssueIds?: number[];       // per-scenario false-positive IDs
  severityThreshold?: "high" | "medium" | "low";
}

interface AgentConfig {
  globalSkipIssueIds?: number[]; // IDs that are NEVER real bugs in this app
  scenarios: Scenario[];
  routes?: string[];             // URLs for the chaos runner
}
```

━━━ RULES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. FIND ALL ROUTES — scan app/ (or pages/) in every sub-app. Cover:
   home, all sections, modals, 404, auth-required pages, empty states.

2. TWO VIEWPORTS — add mobile (375×812) and desktop (1280×800) for complex
   pages. Text-only / legal / error pages need mobile only.

3. NEVER HARDCODE localhost — resolve base URLs from env vars with fallbacks:
   ```ts
   const WEB_URL    = process.env.WEB_URL    ?? "http://localhost:3000";
   const ARTIST_URL = process.env.ARTIST_URL ?? "http://localhost:3001";
   ```
   Every url field must use a template literal: url: `${WEB_URL}/collections`

4. filePath — the real relative path to the source file in the target repo
   that owns this page's layout (e.g. "apps/web/app/collections/page.tsx").
   For modal scenarios, point to the modal component file, not the page.

5. MODAL SCENARIOS — if a button opens a dialog, add a scenario for it:
   ```ts
   steps: [
     { action: "click", selector: "button:has-text('Place offer')" },
     { action: "wait", ms: 600 },
   ]
   ```

6. globalSkipIssueIds — put here ONLY issue IDs that are unconditional
   design decisions in this app and can NEVER be real bugs on any page.
   Common examples for apps with fixed mobile nav, card-based layouts,
   and intentional brand choices:
   - #7  large empty space (auth-wall / 404 layout is intentional)
   - #11 ellipsis truncation on cards (intentional CSS)
   - #12 small uppercase labels (brand typography)
   - #15 mixed text alignment (intentional content variation)
   - #27 icon-only social footer buttons (universally recognisable)
   - #32 filter dropdowns narrower than search bar (intentional)
   - #34 fixed bottom nav overlapping content (intended mobile nav)
   - #36 active nav item looks same as inactive (intentional)
   - #39 sub-pixel icon/text misalignment (rendering artefact)
   - #43 light/transparent modal overlay (brand scrim design)
   Be conservative — if an ID COULD be a real bug on some page, put it
   in skipIssueIds per-scenario instead.

7. skipIssueIds (per-scenario) — use for context-dependent false positives:
   - #8  empty container visible (auth-required sign-in wall)
   - #9  text clipped at edge (content at viewport scroll fold)
   - #10 text overflows (background page content behind an open modal)
   - #16 low contrast (intentionally muted brand colours on a specific page)
   - #20 broken image (CDN not loaded at screenshot time)
   - #22 image clipped (artwork at scroll fold, not an overflow bug)
   - #23 placeholder/skeleton visible (loading state)
   - #33 nav links cut off (non-nav content at scroll edge)
   - #46 mixed icon styles (active/inactive state icons intentionally differ)
   - #49 empty state (loading state or auth wall shows no content)
   Always add an inline comment explaining WHY the ID is skipped.

8. severityThreshold — set "medium" or "high" for pages still under active
   development so only genuinely bad issues block CI.

9. routes (chaos mode) — list 5–10 of the most interactive routes across
   all apps for the chaos runner to click through.

━━━ FULL CHECKLIST (reference for skip decisions) ━━━━━━━━━━━━━━━━━━━━━━

Layout & Responsiveness:
  #1  (high)   horizontal scroll / viewport overflow
  #2  (high)   flex/grid children side-by-side on mobile (should stack)
  #3  (high)   element hidden behind another — z-index overlap
  #4  (high)   fixed-width element wider than screen
  #5  (med)    noticeable element misalignment
  #6  (med)    container has no padding, content touches screen edge
  #7  (med)    inconsistent spacing between adjacent items
  #8  (low)    empty container with no content and no blank-state design

Typography:
  #9  (high)   text clipped or cut off mid-word at container edge
  #10 (high)   text overflows bounding box and overlaps other elements
  #11 (med)    text truncated with ellipsis where full text should show
  #12 (med)    font size appears under 11px
  #13 (med)    line height so tight lines visually overlap
  #14 (low)    heading and body text appear the same size
  #15 (low)    inconsistent text alignment within the same block

Contrast:
  #16 (high)   text nearly invisible — very low contrast vs background
  #17 (high)   icon same colour as background — invisible
  #18 (med)    button label hard to read — insufficient contrast
  #19 (low)    placeholder text indistinguishable from filled-in text

Images & Media:
  #20 (high)   broken image (browser broken-image icon or alt text)
  #21 (high)   image stretched or squished out of aspect ratio
  #22 (med)    image bleeds outside container or clipped unintentionally
  #23 (low)    placeholder / lorem-ipsum image visible in production

Buttons & Interactive:
  #24 (high)   button label clipped or overflows button boundary
  #25 (high)   button/tap target under ~32px tall
  #26 (med)    two interactive elements visually overlap
  #27 (med)    icon-only button with no label or tooltip indicator
  #28 (low)    disabled button looks identical to active button

Forms & Inputs:
  #29 (high)   input field too narrow to show placeholder/typed content
  #30 (med)    form label not visually associated with its input
  #31 (med)    form error message overlaps or is hidden behind content
  #32 (low)    form fields have inconsistent widths in the same form

Navigation:
  #33 (high)   navigation links or menu items cut off / not fully visible
  #34 (high)   navigation bar overlaps main page content
  #35 (med)    breadcrumb or pagination wraps awkwardly onto extra lines
  #36 (low)    active nav item visually identical to inactive items

Cards & Lists:
  #37 (high)   card contents overflow outside card boundary
  #38 (med)    cards in a grid have inconsistent heights
  #39 (med)    list item content vertically misaligned (icon vs text)
  #40 (low)    card shadow or border cut off at container edge

Modals & Overlays:
  #41 (high)   modal content clipped by screen edge, not scrollable
  #42 (high)   modal close button not visible / hidden behind content
  #43 (med)    overlay behind modal is transparent or missing

Icons:
  #44 (high)   icon missing — shows blank space or square fallback glyph
  #45 (med)    icon disproportionately large or small vs accompanying text
  #46 (low)    icons in the same row use different visual styles

Loading & Empty States:
  #47 (high)   raw JSON, error stack trace, or [object Object] visible
  #48 (high)   spinner or skeleton frozen, overlapping already-loaded content
  #49 (med)    empty state shows no message or illustration
  #50 (low)    skeleton layout shape differs from real content it replaces

━━━ OUTPUT FORMAT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Return ONLY the ready-to-use TypeScript file — no explanation, no markdown
fences, just the code starting with the block comment header (include env
var docs, the false-positive skip registry, and the import line).

At the very top of the file include:
  - A comment block listing which env vars must be set in GitHub Actions
    as Secrets / Variables, and what each one should contain.
  - A "False-positive skip registry" comment block explaining each ID in
    globalSkipIssueIds so future maintainers can update it confidently.

Inline comments on individual scenarios are welcome where they explain
a non-obvious skipIssueIds choice.
```
