/**
 * Fix Agent — Step 5 of the visual testing pipeline.
 *
 * Two modes:
 *
 *   'bugfix-branch' (default, nightly):
 *     1. Generate all code fixes in memory
 *     2. Clone the target repo, apply fixes, run BUILD_COMMAND
 *     3. If build passes → stage N commits (one per ticket), ONE push
 *     4. Open / update PR on the 'bugfix' branch
 *
 *   'direct' (chaos / battle-hardening):
 *     Same build check, then one push straight to the base branch. No PR.
 *
 * Required env vars:
 *   DATABASE_URL          — Postgres connection string
 *   UI_FIX_GITHUB_TOKEN   — PAT with repo scope (Contents + Pull requests write)
 *   ANTHROPIC_API_KEY     — Anthropic API key (or set MOCK_LLM=true to skip)
 *
 * Optional:
 *   REPO_OWNER      — defaults to "NullStateLabs"
 *   REPO_NAME       — defaults to "artboxes"
 *   REPO_BRANCH     — defaults to "main"
 *   BUILD_COMMAND   — shell command to verify the build before pushing,
 *                     e.g. "pnpm install --frozen-lockfile && pnpm build"
 *                     Runs inside a shallow clone of the target repo.
 *                     If unset, build check is skipped.
 */

import { fileURLToPath } from "url";
import { execSync } from "child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "fs";
import { join, dirname } from "path";
import { tmpdir } from "os";
import { Octokit } from "@octokit/rest";
import { getOpenTickets, resolveTicket, closePool, type BugTicket } from "../helpers/db-ticket.js";
import { generateCodeFix } from "../helpers/llm-vision.js";

const REPO_OWNER    = process.env.REPO_OWNER  ?? "NullStateLabs";
const REPO_NAME     = process.env.REPO_NAME   ?? "artboxes";
const BASE_BRANCH   = process.env.REPO_BRANCH ?? "main";
const BUGFIX_BRANCH = "bugfix";

function getOctokit(): Octokit {
  const token = process.env.UI_FIX_GITHUB_TOKEN;
  if (!token) throw new Error("UI_FIX_GITHUB_TOKEN is not set");
  return new Octokit({ auth: token });
}

// ── Local build check ─────────────────────────────────────────────────────────

/**
 * Clone the target repo, apply all pending fixes to the working tree,
 * run BUILD_COMMAND. Returns true if the build passes, false otherwise.
 * Returns true immediately if BUILD_COMMAND is not set.
 */
async function verifyBuildLocally(
  fixes: Array<{ filePath: string; fixedContent: string }>,
): Promise<boolean> {
  const buildCommand = process.env.BUILD_COMMAND;
  if (!buildCommand) return true;

  const token = process.env.UI_FIX_GITHUB_TOKEN!;
  const cloneUrl = `https://x-access-token:${token}@github.com/${REPO_OWNER}/${REPO_NAME}.git`;
  const tmpDir = mkdtempSync(join(tmpdir(), "ui-fix-"));

  console.log(`\n  Cloning ${REPO_OWNER}/${REPO_NAME} to verify build before pushing…`);

  try {
    execSync(`git clone --depth 1 --branch ${BASE_BRANCH} ${cloneUrl} ${tmpDir}`, {
      stdio: "inherit",
    });

    // Apply fixes to the cloned working tree
    for (const { filePath, fixedContent } of fixes) {
      const dest = join(tmpDir, filePath);
      mkdirSync(dirname(dest), { recursive: true });
      writeFileSync(dest, fixedContent, "utf-8");
    }

    console.log(`  Running: ${buildCommand}`);
    execSync(buildCommand, { cwd: tmpDir, stdio: "inherit" });

    console.log("  Build passed — proceeding with push");
    return true;
  } catch {
    console.error("  Build FAILED — aborting push. Fix the issues above before retrying.");
    return false;
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}

// ── GitHub Git API ────────────────────────────────────────────────────────────

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
 * Stage N commits (one per ticket) then push ONCE.
 *
 * git.createCommit  — stores a commit object in GitHub's object store.
 *                     No push. No Vercel trigger.
 * git.updateRef     — the actual push. Called once at the very end.
 *
 * One push = one Vercel preview = one email.
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

  for (const fix of fixes) {
    const { data: parentCommit } = await octokit.git.getCommit({
      owner: REPO_OWNER, repo: REPO_NAME, commit_sha: currentSha,
    });
    const { data: newTree } = await octokit.git.createTree({
      owner: REPO_OWNER, repo: REPO_NAME,
      base_tree: parentCommit.tree.sha,
      tree: [{
        path: fix.filePath,
        mode: "100644" as const,
        type: "blob" as const,
        content: fix.fixedContent,
      }],
    });
    const { data: newCommit } = await octokit.git.createCommit({
      owner: REPO_OWNER, repo: REPO_NAME,
      message: `fix(ui): ${fix.component} [ticket #${fix.ticketId}]`,
      tree: newTree.sha,
      parents: [currentSha],
    });
    currentSha = newCommit.sha;
    console.log(`  Staged: ${newCommit.sha.slice(0, 8)} — ${fix.component}`);
  }

  // The one and only push
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

// ── PR management ─────────────────────────────────────────────────────────────

async function ensureBugfixPR(
  octokit: Octokit,
  fixed: Array<BugTicket & { id: number }>,
): Promise<string> {
  const { data: existing } = await octokit.pulls.list({
    owner: REPO_OWNER, repo: REPO_NAME,
    head: `${REPO_OWNER}:${BUGFIX_BRANCH}`,
    base: BASE_BRANCH,
    state: "open",
  });

  const body = [
    `## UI Bug Fixes — auto-generated`,
    ``,
    ...fixed.map((t) => `- **\`${t.component}\`** — ticket #${t.id}: ${t.reasoning}`),
    ``,
    `> Build verified locally before push. Review and merge.`,
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
  mode?: "bugfix-branch" | "direct";
}

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

  // ── Phase 1: generate all fixes in memory (zero network writes) ───────────

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

  // ── Phase 2: build check — push only if the build passes ─────────────────

  const buildPassed = await verifyBuildLocally(
    readyFixes.map((f) => ({ filePath: f.filePath, fixedContent: fileCache.get(f.filePath)! })),
  );

  if (!buildPassed) {
    console.log("\nFix Agent done. Push aborted — build failed.");
    return;
  }

  // ── Phase 3: stage N commits, push once ──────────────────────────────────

  console.log(`\n  Pushing ${readyFixes.length} commit(s)…`);

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
    console.log(`  Pushed tip: ${commitSha.slice(0, 8)}`);
  } catch (err) {
    console.error("  Push failed:", err);
    return;
  }

  // ── Phase 4: resolve tickets ──────────────────────────────────────────────

  for (const { ticket } of readyFixes) {
    await resolveTicket(ticket.id);
  }

  // ── Phase 5: open / update PR ─────────────────────────────────────────────

  if (mode === "bugfix-branch") {
    await ensureBugfixPR(octokit, readyFixes.map((f) => f.ticket));
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
