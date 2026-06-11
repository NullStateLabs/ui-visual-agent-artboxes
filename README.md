# ui-visual-agent

AI-powered visual regression testing pipeline. Two modes:

- **Nightly** — runs defined scenarios, finds UI bugs, opens GitHub PRs with fixes
- **Chaos** — Claude autonomously explores the app, clicking wherever it finds interesting elements, fixes committed directly to `main`. Built for battle-hardening in the days before launch.

Reusable across projects. Point it at any running app, drop in a config file.

---

## How it works

### Nightly mode

```
every night (03:00 UTC)

Playwright                        Fix Agent
opens each scenario URL    →      reads open tickets from Postgres
+ viewport size                   → Claude generates code fix
     │                            → opens PR on bugfix branch
     ▼                            → ticket marked resolved
screenshot.png
     │
     ▼
Claude Vision
checks against 50-issue checklist
     │
  pass ──► nothing logged
  fail ──► bug ticket inserted into Postgres
           → fix agent runs automatically (AUTO_FIX=true)
```

### Chaos mode

```
every 5 min, pre-launch only (enable schedule in chaos.yml)

for each route in config.routes (or discovered from /sitemap.xml):

  step 1..N:
    screenshot
       │
       ├─ Claude Vision checks against 50-issue checklist → ticket if fail
       │
       └─ Claude decides what to click next
             │
          execute action (getByText → click / fill)
             │
          repeat

  fix agent runs after session → commits directly to main
```

---

## Connecting a new project (step-by-step)

### 1. Push this repo to GitHub

```bash
git add .
git commit -m "feat: initial setup"
git push origin main
```

### 2. Create a Postgres database (Neon — free, 2 min)

1. Sign up at [neon.tech](https://neon.tech)
2. "New project" → pick a name → region **EU Central**
3. Dashboard → **Connection string** → copy the string:
   ```
   postgresql://user:pass@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require
   ```

### 3. Create a GitHub PAT for the fix agent

The fix agent needs write access to the repo it will open PRs in (e.g. `artboxes`).

1. [github.com/settings/tokens](https://github.com/settings/tokens) → **Fine-grained tokens** → "Generate new token"
2. **Resource owner**: your org (e.g. `NullStateLabs`)
3. **Repository access**: "Only select repositories" → select the target repo (`artboxes`)
4. **Permissions**: `Contents` → Read and write, `Pull requests` → Read and write
5. Generate → copy the token (shown only once)

### 4. Add Secrets and Variables to this repo on GitHub

Go to: **github.com/YOUR-ORG/ui-visual-agent → Settings → Secrets and variables → Actions**

**Secrets tab:**

| Name | Value |
|---|---|
| `ANTHROPIC_API_KEY` | Anthropic API key |
| `DATABASE_URL` | Neon connection string from step 2 |
| `UI_FIX_GITHUB_TOKEN` | PAT from step 3 |
| `BASE_URL` | Public URL of the app to test, e.g. `https://artboxes.io` |

**Variables tab:**

| Name | Value |
|---|---|
| `GITHUB_REPO_OWNER` | e.g. `NullStateLabs` |
| `GITHUB_REPO_NAME` | e.g. `artboxes` |
| `GITHUB_BASE_BRANCH` | `main` |

### 5. Create the config file for your project

```bash
cp examples/artboxes-config.ts ui-agent.config.ts
```

Edit `ui-agent.config.ts` — update the import path and adapt the routes to your app:

```diff
- import type { AgentConfig } from "../src/runner/types.js";
+ import type { AgentConfig } from "./src/runner/types.js";
```

Then commit it:

```bash
git add ui-agent.config.ts
git commit -m "feat: add project config"
git push origin main
```

### 6. Create the database table

Run once — either locally with your `DATABASE_URL` in `.env`, or trigger it manually in CI:

```bash
pnpm migrate
```

### 7. Test the pipeline manually

1. Go to: **github.com/YOUR-ORG/ui-visual-agent → Actions → "Nightly Visual QA"**
2. Click **"Run workflow"** → "Run workflow"
3. Watch the logs live

Expected output if no issues found:
```
Playwright runs 5 scenarios…
Fix Agent starting… (mode: bugfix-branch)
Found 0 open ticket(s)
```

Expected output if issues are found:
```
[HIGH] Bug ticket #1: flex children appear side-by-side on mobile viewport
Fix Agent starting… (mode: bugfix-branch)
Branch 'bugfix' created from main
PR opened: https://github.com/NullStateLabs/artboxes/pull/42
```

### 8. Verify results

- **Screenshots**: Actions → workflow run → Artifacts → `screenshots-*`
- **Bug tickets**: check your Neon DB — `SELECT * FROM ui_bug_tickets;`
- **Fix PRs**: check the target repo (`artboxes`) for a PR from the `bugfix` branch

### 9. Activate chaos mode (pre-launch only)

Uncomment the schedule in [.github/workflows/chaos.yml](.github/workflows/chaos.yml):

```yaml
# Before:
# schedule:
#   - cron: "*/5 * * * *"

# After:
schedule:
  - cron: "*/5 * * * *"
```

Push → chaos mode fires every 5 minutes, commits fixes directly to `main` of the target repo.
Re-comment after launch.

---

## Local setup (without CI)

```bash
pnpm install
pnpm exec playwright install chromium
cp .env.example .env   # fill in BASE_URL, ANTHROPIC_API_KEY, DATABASE_URL
pnpm migrate
```

| Command | What it does |
|---|---|
| `MOCK_LLM=true pnpm test` | Full pipeline dry-run — no API calls, always finds 1 mock issue |
| `pnpm test` | Real nightly run against BASE_URL |
| `pnpm test:ci` | Same + auto-triggers fix agent (opens PR on `bugfix` branch) |
| `pnpm test:chaos` | Chaos exploration run |
| `pnpm test:chaos:ci` | Same + commits fixes directly to main |
| `pnpm fix` | Manually process any open tickets → open PR |
| `pnpm migrate` | Create `ui_bug_tickets` table |

### Environment variables

| Variable | Description |
|---|---|
| `BASE_URL` | URL of the app to test, e.g. `https://artboxes.io` |
| `ANTHROPIC_API_KEY` | Anthropic API key |
| `DATABASE_URL` | Postgres connection string |
| `UI_FIX_GITHUB_TOKEN` | GitHub PAT with `repo` scope (Contents + Pull requests write) |
| `GITHUB_REPO_OWNER` | Target repo owner, e.g. `NullStateLabs` |
| `GITHUB_REPO_NAME` | Target repo name, e.g. `artboxes` |
| `GITHUB_BASE_BRANCH` | Base branch, default `main` |
| `MOCK_LLM` | Set `true` to skip real API calls during pipeline testing |

---

## Usage

| Command | What it does |
|---|---|
| `pnpm test` | Run nightly scenarios, print findings |
| `pnpm test:ci` | Same + auto-trigger fix agent (opens PRs) |
| `pnpm test:chaos` | Run chaos exploration, print findings |
| `pnpm test:chaos:ci` | Same + auto-trigger fix agent (commits to main) |
| `pnpm fix` | Manually process open tickets → open PRs |
| `pnpm migrate` | Create `ui_bug_tickets` table |

---

## Config file

`ui-agent.config.ts` in the repo root:

```ts
import type { AgentConfig } from "./src/runner/types.js";

const config: AgentConfig = {
  // ── Nightly scenarios ─────────────────────────────────────────────
  scenarios: [
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
      label: "connect wallet modal",
      url: "/",
      viewport: { width: 375, height: 812 },
      steps: [
        { action: "click", selector: "button:has-text('Connect')" },
        { action: "wait", ms: 600 },
      ],
    },
    {
      label: "404 page",
      url: "/this-page-does-not-exist",
      viewport: { width: 375, height: 812 },
    },
  ],

  // ── Chaos mode routes ─────────────────────────────────────────────
  // If omitted, routes are discovered from /sitemap.xml automatically.
  routes: [
    "/",
    "/collections",
    "/mint",
    "/profile",
  ],
};

export default config;
```

### Scenario options (nightly)

| Field | Type | Description |
|---|---|---|
| `label` | `string` | Name shown in test output and bug tickets |
| `url` | `string` | Path relative to `BASE_URL` |
| `viewport` | `{ width, height }` | Defaults to `375×812` (mobile) |
| `steps` | `StepAction[]` | Interactions before the screenshot (click, fill, hover, wait, scroll, press) |
| `skipIssueIds` | `number[]` | Checklist issue IDs to ignore for this scenario |
| `severityThreshold` | `"high" \| "medium" \| "low"` | Only report issues at or above this level. Default: `"low"` |

### Chaos options

| Field | Type | Description |
|---|---|---|
| `routes` | `string[]` | Starting routes for exploration. Falls back to `/sitemap.xml` discovery then `["/"]` |
| `CHAOS_STEPS` env var | number | Exploration steps per route. Default: `12` |

---

## No element IDs required

The chaos runner does not require `data-testid` or IDs on clickable elements. Claude reads the screenshot visually, identifies interesting elements by their visible text, and Playwright locates them via `getByText()`. Any standard button, link, input, tab or nav item is automatically discoverable.

---

## GitHub Actions

### Nightly (`.github/workflows/nightly.yml`)
Runs at 03:00 UTC. Scenarios → checklist → tickets → all fixes committed to a single `bugfix` branch → one PR opened (or updated) in the target repo.

### Chaos (`.github/workflows/chaos.yml`)
Manual trigger (`workflow_dispatch`) by default. The `schedule` block is commented out — **uncomment it only during the pre-launch battle-hardening window**, then re-comment after launch.

```yaml
# Uncomment to activate chaos cron (pre-launch only):
# schedule:
#   - cron: "*/5 * * * *"
```

Chaos fixes are committed **directly to `main`**, not a branch. Only enable this when you trust the pipeline.

---

## Required GitHub Secrets / Variables

| Secret | Value |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `ANTHROPIC_API_KEY` | Anthropic API key |
| `UI_FIX_GITHUB_TOKEN` | GitHub PAT with `repo` scope |
| `BASE_URL` | URL of the deployed app |

| Variable | Value |
|---|---|
| `GITHUB_REPO_OWNER` | e.g. `NullStateLabs` |
| `GITHUB_REPO_NAME` | e.g. `artboxes` |
| `GITHUB_BASE_BRANCH` | e.g. `main` |

---

## UI Issues Checklist

Claude Vision checks each screenshot against 50 common UI problems across 10 categories.

| Category | Issues |
|---|---|
| Layout | overflow, unwanted side-by-side on mobile, z-index overlap, fixed-width breakage, misalignment, missing padding, inconsistent spacing |
| Typography | clipped text, overflow, ellipsis, tiny font, tight line-height, no visual hierarchy |
| Contrast | invisible text, invisible icon, low-contrast button label, unreadable placeholder |
| Images | broken image, stretched aspect ratio, unintended clip, placeholder visible |
| Interactive | button label overflow, tap target too small, overlapping controls, icon-only with no label |
| Forms | input too narrow, label misassociation, error message overlap, inconsistent widths |
| Navigation | links cut off, nav overlapping content, awkward breadcrumb wrap |
| Cards | content overflow, inconsistent grid heights, icon/text misalignment |
| Modals | clipped by screen edge, hidden close button, transparent overlay |
| States | raw JSON / stack trace visible, frozen spinner, empty state with no message |

Full list: [src/checklists/common-ui-issues.ts](src/checklists/common-ui-issues.ts)

---

## File structure

```
ui-visual-agent/
├── .github/workflows/
│   ├── nightly.yml               # 03:00 UTC cron → scenario tests → PRs
│   └── chaos.yml                 # every 5 min (pre-launch) → exploration → direct commits
├── src/
│   ├── agent/
│   │   └── fix-agent.ts          # runFixAgent({ mode }) — bugfix-branch PR or direct commit
│   ├── checklists/
│   │   └── common-ui-issues.ts   # 50-item checklist
│   ├── helpers/
│   │   ├── db-ticket.ts          # Postgres CRUD
│   │   ├── llm-vision.ts         # analyzeScreenshotWithChecklist, suggestNextAction, generateCodeFix
│   │   ├── migrate.ts            # CREATE TABLE
│   │   └── sitemap.ts            # fetch /sitemap.xml → route list
│   └── runner/
│       ├── chaos-runner.ts       # autonomous exploration session
│       ├── scenario-runner.ts    # deterministic scenario execution
│       └── types.ts              # Scenario / AgentConfig / StepAction
├── specs/
│   ├── visual-checklist.spec.ts  # nightly spec
│   └── chaos.spec.ts             # chaos spec
├── examples/
│   ├── artboxes-config.ts
│   └── section-header-mobile.spec.ts
├── screenshots/
│   └── chaos/                    # chaos session screenshots (step-01-home.png …)
├── playwright.config.ts
├── .env.example
└── package.json
```

---

## Database schema

```sql
CREATE TABLE ui_bug_tickets (
  id              SERIAL PRIMARY KEY,
  component       TEXT        NOT NULL,
  file_path       TEXT        NOT NULL,
  assertion       TEXT        NOT NULL,
  reasoning       TEXT        NOT NULL,
  screenshot_path TEXT        NOT NULL,
  status          TEXT        NOT NULL DEFAULT 'open',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at     TIMESTAMPTZ
);
```
