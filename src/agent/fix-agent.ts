/**
 * Fix Agent — Step 5 of the visual testing pipeline.
 *
 * Two modes:
 *
 *   'bugfix-branch' (default, nightly):
 *     All fixes committed in ONE batch commit to a single 'bugfix' branch.
 *     CI is polled after the push. PR opened (or updated) once checks pass.
 *
 *   'direct' (chaos / battle-hardening):
 *     One batch commit applied directly to the base branch. No PR.
 *
 * Required env vars:
 *   DATABASE_URL          — Postgres connection string
 *   UI_FIX_GITHUB_TOKEN   — PAT with repo scope (Contents + Pull requests write)
 *   ANTHROPIC_API_KEY     — Anthropic API key (or set MOCK_LLM=true to skip)
 *
 * Optional:
 *   REPO_OWNER   — defaults to "NullStateLabs"
 *   REPO_NAME    — defaults to "artboxes"
 *   REPO_BRANCH  — defaults to "main"
 *   WAIT_FOR_CI  — set "true" to poll GitHub Checks after push and only open
 *                  the PR once all checks pass (timeout: 10 min)
 */

import { fileURLToPath } from "url";
import { Octokit } from "@octokit/rest";
import { getOpenTickets, resolveTicket, closePool, type BugTicket } from "../helpers/db-ticket.js";
import { generateCodeFix } from "../helpers/llm-vision.js";

const REPO_OWNER  = process.env.REPO_OWNER  ?? "NullStateLabs";
const REPO_NAME   = process.env.REPO_NAME   ?? "artboxes";
const BASE_BRANCH = process.env.REPO_BRANCH ?? "main";
const BUGFIX_BRANCH = "bugfix";

function getOctokit(): Octokit {
  const token = process.env.UI_FIX_GITHUB_TOKEN;
  if (!token) throw new Error("UI_FIX_GITHUB_TOKEN is not set");
  return new Octokit({ auth: token });
}

// ── GitHub Git Tree API ───────────────────────────────────────────────────────

async function getFileContent(
  octokit: Octokit,
  filePath: string,
  ref: string,
): Promise<string> {
  const { data } = await octokit.repos.getContent({
    owner: REPO_OWNER, repo: REPO_NAME, path: filePath, ref,
  });
  if (Array.isArray(data) || data.type !== "file") {
    throw new Error(`${filePath} is not a file`);
  }
  return Buffer.from(data.content, "base64").toString("utf-8");
}

/**
 * Create one commit per fix, then push ONCE at the end.
 *
 * git.createCommit  — local to GitHub's object store, no push, no Vercel trigger
 * git.updateRef     — the actual push; called once for all commits combined
 *
 * Result: clean history (one commit per ticket), one Vercel preview, one email.
 * Returns the SHA of the final (tip) commit.
 */
async function commitAllAndPush(
  octokit: Octokit,
  branch: string,
  fixes: Array<{ filePath: string; fixedContent: string; ticketId: number; component: string }>,
): Promise<string> {
  const { data: refData } = await octokit.git.getRef({
    owner: REPO_OWNER, repo: REPO_NAME, ref: `heads/${branch}`,
  });
  let currentSha = refData.object.sha;

  // Build commit chain — no push yet
  for (const fix of fixes) {
    const { data: parentCommit } = await octokit.git.getCommit({
      owner: REPO_OWNER, repo: REPO_NAME, commit_sha: currentSha,
    });

    const { data: newTree } = await octokit.git.createTree({
      owner: REPO_OWNER, repo: REPO_NAME,
      base_tree: parentCommit.tree.sha,
      tree: [{ path: fix.filePath, mode: "100644" as const, type: "blob" as const, content: fix.fixedContent }],
    });

    const { data: newCommit } = await octokit.git.createCommit({
      owner: REPO_OWNER, repo: REPO_NAME,
      message: `fix(ui): ${fix.component} [ticket #${fix.ticketId}]`,
      tree: newTree.sha,
      parents: [currentSha],
    });

    currentSha = newCommit.sha;
    console.log(`  Staged commit ${newCommit.sha.slice(0, 8)}: ${fix.component}`);
  }

  // ONE push — triggers exactly one Vercel preview deployment
  await octokit.git.updateRef({
    owner: REPO_OWNER, repo: REPO_NAME,
    ref: `heads/${branch}`,
    sha: currentSha,
  });

  return currentSha;
}

async function ensureBugfixBranch(octokit: Octokit): Promise<void> {
  try {
    await octokit.git.getRef({
      owner: REPO_OWNER, repo: REPO_NAME, ref: `heads/${BUGFIX_BRANCH}`,
    });
    console.log(`  Branch '${BUGFIX_BRANCH}' already exists`);
  } catch {
    const { data: mainRef } = await octokit.git.getRef({
      owner: REPO_OWNER, repo: REPO_NAME, ref: `heads/${BASE_BRANCH}`,
    });
    await octokit.git.createRef({
      owner: REPO_OWNER, repo: REPO_NAME,
      ref: `refs/heads/${BUGFIX_BRANCH}`,
      sha: mainRef.object.sha,
    });
    console.log(`  Created branch '${BUGFIX_BRANCH}' from ${BASE_BRANCH}`);
  }
}

// ── CI polling ────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Poll GitHub Checks for the given commit SHA until all complete or timeout.
 * Returns true if all checks passed (or timed out — we don't block on timeout).
 */
async function waitForCI(
  octokit: Octokit,
  ref: string,
  timeoutMs = 10 * 60 * 1000,
): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  console.log(`\n  Waiting for CI checks on ${ref.slice(0, 8)}… (timeout: ${timeoutMs / 60_000} min)`);

  await sleep(15_000); // let GitHub register the push

  while (Date.now() < deadline) {
    const { data } = await octokit.checks.listForRef({
      owner: REPO_OWNER, repo: REPO_NAME, ref,
    });
    const runs = data.check_runs;

    if (runs.length === 0) {
      console.log("  No checks registered yet, retrying…");
      await sleep(20_000);
      continue;
    }

    const pending = runs.filter((r) => r.status !== "completed");
    if (pending.length > 0) {
      console.log(`  ${pending.length} check(s) still running…`);
      await sleep(30_000);
      continue;
    }

    const failed = runs.filter(
      (r) => r.conclusion !== "success" && r.conclusion !== "skipped" && r.conclusion !== "neutral",
    );
    if (failed.length > 0) {
      console.error(`  CI failed: ${failed.map((r) => `${r.name} (${r.conclusion})`).join(", ")}`);
      return false;
    }

    console.log(`  All ${runs.length} CI check(s) passed`);
    return true;
  }

  console.warn(`  CI timed out after ${timeoutMs / 60_000} min — proceeding anyway`);
  return true; // non-blocking timeout
}

// ── PR management ─────────────────────────────────────────────────────────────

async function ensureBugfixPR(
  octokit: Octokit,
  fixed: Array<BugTicket & { id: number }>,
  ciPassed: boolean,
): Promise<string> {
  const { data: existing } = await octokit.pulls.list({
    owner: REPO_OWNER, repo: REPO_NAME,
    head: `${REPO_OWNER}:${BUGFIX_BRANCH}`,
    base: BASE_BRANCH,
    state: "open",
  });

  const ciWarning = ciPassed ? "" : "\n\n> ⚠️ **CI did not pass** — review failures before merging.";

  const body = [
    `## UI Bug Fixes — auto-generated`,
    ``,
    ...fixed.map((t) => `- **\`${t.component}\`** — ticket #${t.id}: ${t.reasoning}`),
    ``,
    `> Fixes generated by the visual testing pipeline. Review before merging.`,
    ciWarning,
  ].join("\n");

  if (existing.length > 0) {
    await octokit.pulls.update({
      owner: REPO_OWNER, repo: REPO_NAME,
      pull_number: existing[0].number,
      body,
    });
    console.log(`  PR updated: ${existing[0].html_url}`);
    return existing[0].html_url;
  }

  const { data } = await octokit.pulls.create({
    owner: REPO_OWNER, repo: REPO_NAME,
    title: `fix(ui): visual regression fixes (${fixed.length} ticket${fixed.length !== 1 ? "s" : ""})`,
    body,
    head: BUGFIX_BRANCH,
    base: BASE_BRANCH,
  });

  console.log(`  PR opened: ${data.html_url}`);
  return data.html_url;
}

// ── Main ──────────────────────────────────────────────────────────────────────

export interface FixAgentOpts {
  /**
   * 'bugfix-branch' (default): all fixes in one batch commit → CI poll → one PR.
   * 'direct': one batch commit straight to the base branch. No PR.
   */
  mode?: "bugfix-branch" | "direct";
}

/**
 * Process all open bug tickets.
 * Does NOT close the Postgres pool — the caller is responsible for that.
 */
export async function runFixAgent(opts: FixAgentOpts = {}): Promise<void> {
  const mode = opts.mode ?? "bugfix-branch";
  console.log(`Fix Agent starting… (mode: ${mode})`);

  if (!process.env.UI_FIX_GITHUB_TOKEN) {
    console.warn("UI_FIX_GITHUB_TOKEN is not set — skipping auto-fix");
    return;
  }

  let octokit: Octokit;
  try {
    octokit = getOctokit();
  } catch (err) {
    console.warn(`Fix Agent: ${err} — skipping`);
    return;
  }

  const tickets = await getOpenTickets();
  console.log(`Found ${tickets.length} open ticket(s)`);
  if (tickets.length === 0) return;

  const targetBranch = mode === "direct" ? BASE_BRANCH : BUGFIX_BRANCH;
  console.log(`  Target: ${REPO_OWNER}/${REPO_NAME} @ ${targetBranch}`);

  if (mode === "bugfix-branch") {
    try {
      await ensureBugfixBranch(octokit);
    } catch (err) {
      console.error(
        `Fix Agent: cannot access ${REPO_OWNER}/${REPO_NAME} — check REPO_OWNER, REPO_NAME and UI_FIX_GITHUB_TOKEN.\n  Error: ${err}`,
      );
      return;
    }
  }

  // ── Phase 1: generate all fixes locally (zero pushes) ────────────────────

  // Cache file contents per path so multiple tickets on the same file chain:
  // ticket A patches the file → ticket B receives the already-patched version.
  const fileCache = new Map<string, string>();

  interface ReadyFix {
    ticket: BugTicket & { id: number };
    filePath: string;
  }
  const readyFixes: ReadyFix[] = [];

  for (const ticket of tickets) {
    console.log(`\nGenerating fix for ticket #${ticket.id}: ${ticket.component}`);

    if (!ticket.file_path || !ticket.file_path.includes(".")) {
      console.warn(
        `  Skipping: file_path "${ticket.file_path || "(empty)"}" is not a source file path.\n` +
        `  Set filePath in your scenario config, e.g. filePath: "app/upcoming/page.tsx"`,
      );
      continue;
    }

    try {
      if (!fileCache.has(ticket.file_path)) {
        const content = await getFileContent(octokit, ticket.file_path, targetBranch);
        fileCache.set(ticket.file_path, content);
      }
      const currentContent = fileCache.get(ticket.file_path)!;

      const fixedContent = await generateCodeFix({
        filePath: ticket.file_path,
        fileContent: currentContent,
        component: ticket.component,
        assertion: ticket.assertion,
        reasoning: ticket.reasoning,
      });

      if (fixedContent === currentContent) {
        console.log("  No changes generated — skipping");
        continue;
      }

      // Update cache so the next ticket on this file sees the patched version
      fileCache.set(ticket.file_path, fixedContent);
      readyFixes.push({ ticket, filePath: ticket.file_path });
      console.log(`  Fix ready`);
    } catch (err) {
      console.error(`  Failed:`, err);
    }
  }

  if (readyFixes.length === 0) {
    console.log("\nFix Agent done. No fixes to commit.");
    return;
  }

  // ── Phase 2: N commits (one per ticket), ONE push at the end ─────────────

  console.log(`\n  Staging ${readyFixes.length} commit(s) then pushing once…`);

  let commitSha: string;
  try {
    commitSha = await commitAllAndPush(
      octokit,
      targetBranch,
      readyFixes.map((f) => ({
        filePath: f.filePath,
        fixedContent: fileCache.get(f.filePath)!,
        ticketId: f.ticket.id,
        component: f.ticket.component,
      })),
    );
    console.log(`  Pushed tip: ${commitSha.slice(0, 8)} — one Vercel preview for all fixes`);
  } catch (err) {
    console.error("  Push failed:", err);
    return;
  }

  // ── Phase 3: resolve tickets ──────────────────────────────────────────────

  for (const { ticket } of readyFixes) {
    await resolveTicket(ticket.id);
  }

  // ── Phase 4: optional CI check ────────────────────────────────────────────

  let ciPassed = true;
  if (process.env.WAIT_FOR_CI === "true") {
    ciPassed = await waitForCI(octokit, commitSha);
  }

  // ── Phase 5: open / update PR ─────────────────────────────────────────────

  if (mode === "bugfix-branch") {
    await ensureBugfixPR(octokit, readyFixes.map((f) => f.ticket), ciPassed);
  }

  console.log(`\nFix Agent done. ${readyFixes.length}/${tickets.length} ticket(s) resolved.`);
}

// CLI entry point
if (fileURLToPath(import.meta.url) === process.argv[1]) {
  runFixAgent()
    .then(() => closePool())
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
