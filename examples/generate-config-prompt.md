# Prompt: Generate ui-agent.config.ts for this project

Paste the prompt below into Claude **in the context of your target project**.
Claude will explore the codebase and return a ready-to-use `ui-agent.config.ts`
that you can copy to the repo root.

---

```
I'm connecting ui-visual-agent to this project — a pipeline that takes
Playwright screenshots, checks them against a 50-issue UI checklist via
Claude Vision, and automatically opens fix PRs.

Your task: analyse this project's structure and generate a complete
`ui-agent.config.ts` file for the repo root.

---

Config type (import from here):

```ts
import type { AgentConfig } from "./src/runner/types.js";

interface Scenario {
  label: string;
  url: string;
  filePath?: string;         // path to the source file in this repo responsible for this page
  steps?: StepAction[];      // clicks / input to perform before the screenshot
  viewport?: { width: number; height: number };
  skipIssueIds?: number[];   // issue IDs from the checklist below that are intentional design decisions
  severityThreshold?: "high" | "medium" | "low";
}
```

---

Rules for generating the config:

1. **Find all routes** — scan `app/` (or `pages/`) and identify every
   public route: home, all sections, modals, 404, auth-required pages,
   empty states.

2. **Two viewports per route** — add a mobile scenario (375×812) and a
   desktop scenario (1280×800) for pages with complex layouts. Simple
   pages (text-only, error pages) need mobile only.

3. **filePath** — set the real relative path to the file in this repo
   that owns the page layout (e.g. `app/collections/page.tsx`). This is
   the file the fix agent will edit when it finds a bug on that page.
   For modal scenarios, point to the modal component file.

4. **Modal / dialog scenarios** — if buttons open dialogs, add a
   separate scenario with steps that trigger the dialog:
   ```ts
   steps: [
     { action: "click", selector: "button:has-text('Connect')" },
     { action: "wait", ms: 600 },
   ]
   ```
   filePath should point to the modal component, not the page.

5. **skipIssueIds** — use this when a page has intentional UI behaviour
   that would otherwise trigger a false positive. Reference the list below:
   - 8  — empty container (auth-required pages, intentional empty state)
   - 11 — intentional text truncation with ellipsis
   - 43 — intentional blur / overlay
   - 46 — icon-only accordion toggle (intentional design)
   - 49 — 404 page has no content by design

6. **severityThreshold** — set `"medium"` or `"high"` for pages where
   minor visual imperfections are acceptable (e.g. marketing landing pages
   or pages that are still under active development).

7. **routes** (chaos mode) — list the 5–10 most important routes for
   autonomous exploration. The chaos runner will navigate these pages
   autonomously, clicking whatever looks interactive.

---

Full 50-issue checklist (for reference when deciding skipIssueIds):

Layout:        #1 overflow, #2 mobile side-by-side, #3 z-index overlap,
               #4 fixed-width breakage, #5 misalignment, #6 missing padding,
               #7 inconsistent spacing
Typography:    #8 empty container, #9 clipped text, #10 text overflow,
               #11 ellipsis truncation, #12 font too small, #13 tight line-height,
               #14 no visual hierarchy
Contrast:      #15 invisible text, #16 invisible icon, #17 low-contrast button,
               #18 unreadable placeholder
Images:        #19 broken image, #20 stretched aspect ratio, #21 unintended clip,
               #22 placeholder visible in production
Interactive:   #23 button label overflow, #24 tap target too small,
               #25 overlapping controls, #26 icon-only with no label
Forms:         #27 input too narrow, #28 label misassociation, #29 error overlap,
               #30 inconsistent field widths
Navigation:    #31 nav links cut off, #32 nav overlapping content,
               #33 awkward breadcrumb wrap
Cards:         #34 card content overflow, #35 inconsistent grid heights,
               #36 icon / text misalignment inside card
Modals:        #37 clipped by screen edge, #38 close button hidden,
               #39 transparent overlay (modal backdrop missing)
States:        #40 raw JSON / stack trace visible, #41 frozen spinner,
               #42 empty state with no message, #43 intentional blur overlay,
               #44 skeleton stuck, #45 error state unstyled, #46 icon-only toggle,
               #47 badge overflow, #48 tooltip cut off, #49 404 no message,
               #50 maintenance mode

---

Output format:

Return ONLY the ready-to-use TypeScript file — no explanation, no markdown
fences, just the code starting with the import statement. Inline comments
are welcome where they explain a non-obvious skipIssueIds or severityThreshold
choice.
```
