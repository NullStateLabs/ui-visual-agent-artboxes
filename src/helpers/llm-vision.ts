import Anthropic from "@anthropic-ai/sdk";
import * as fs from "fs";
import { COMMON_UI_ISSUES, type UIIssue } from "../checklists/common-ui-issues.js";

// Set MOCK_LLM=true to skip the real API call (useful for pipeline testing without an API key).
const MOCK_LLM = process.env.MOCK_LLM === "true";

function getClient(): Anthropic {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

export interface ChecklistFinding {
  id: number;
  category: string;
  description: string;
  severity: "high" | "medium" | "low";
  reasoning: string;
}

export interface ChecklistResult {
  pass: boolean;
  findings: ChecklistFinding[];
}

/**
 * Analyze a screenshot against the full common-UI-issues checklist.
 * Returns every issue that is clearly present in the screenshot.
 */
export async function analyzeScreenshotWithChecklist(opts: {
  imagePath: string;
  issues?: UIIssue[];
  skipIds?: number[];
  severityThreshold?: "high" | "medium" | "low";
}): Promise<ChecklistResult> {
  const issues = (opts.issues ?? COMMON_UI_ISSUES).filter(
    (i) => !opts.skipIds?.includes(i.id)
  );

  if (MOCK_LLM) {
    console.log("[mock-llm] Returning mock checklist failure for issue #2");
    return {
      pass: false,
      findings: [
        {
          id: 2,
          category: "layout",
          severity: "high",
          description: issues.find((i) => i.id === 2)?.description ?? "",
          reasoning: "MOCK: flex children appear side-by-side on mobile viewport",
        },
      ],
    };
  }

  const imageData = fs.readFileSync(opts.imagePath).toString("base64");

  const checklistText = issues
    .map((i) => `[${i.id}] (${i.severity}) ${i.description}`)
    .join("\n");

  const response = await getClient().messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: "image/png", data: imageData },
          },
          {
            type: "text",
            text: [
              "You are a strict UI quality inspector. Examine the screenshot against the checklist below.",
              "",
              "Report a finding ONLY if ALL of the following are true:",
              "1. The issue is unmistakably visible — you are 95%+ certain it is a genuine bug, not an intentional design choice.",
              "2. It is NOT caused by viewport clipping — elements near the very top/bottom/right edge may be partially in-view because the page scrolls beyond the screenshot.",
              "3. It is NOT a fixed header or bottom navigation sitting above scrollable content — fixed navs deliberately overlap the scroll area.",
              "4. It is NOT text truncated by CSS ellipsis (…) inside a card, list item, or table cell — intentional truncation is standard in card layouts.",
              "5. It is NOT a light, semi-transparent, or blurred modal overlay/scrim — many designs use subtle scrims intentionally.",
              "6. It is NOT an overlay badge, label, or tag intentionally placed on top of an image (e.g. 'UPCOMING', 'SOLD', status chips).",
              "7. It is NOT content of a background page visible behind an open modal or drawer — background content dimming/clipping is expected when a modal is open.",
              "8. It is NOT a minor sub-pixel rendering difference in icon-to-text alignment — only report alignment if elements are clearly offset by multiple pixels.",
              "",
              "When in doubt, do NOT report. A missed real bug is far less costly than a false positive that blocks CI.",
              "",
              "Checklist:",
              checklistText,
              "",
              "Reply with JSON only — no markdown, no prose:",
              '[{ "id": <number>, "reasoning": "<one sentence describing exactly what you see>" }]',
              "Return an empty array [] if no issues are found.",
            ].join("\n"),
          },
        ],
      },
    ],
  });

  const raw = response.content[0].type === "text" ? response.content[0].text.trim() : "[]";
  const text = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

  let rawFindings: Array<{ id: number; reasoning: string }> = [];
  try {
    rawFindings = JSON.parse(text);
  } catch {
    console.error("LLM returned non-JSON:", raw);
  }

  const severityOrder = { high: 3, medium: 2, low: 1 };
  const threshold = opts.severityThreshold ?? "low";

  const findings: ChecklistFinding[] = rawFindings
    .map((f) => {
      const issue = issues.find((i) => i.id === f.id);
      if (!issue) return null;
      return { ...issue, reasoning: f.reasoning };
    })
    .filter((f): f is ChecklistFinding => {
      if (!f) return false;
      return severityOrder[f.severity] >= severityOrder[threshold];
    });

  return { pass: findings.length === 0, findings };
}

export async function generateCodeFix(opts: {
  filePath?: string;
  fileContent: string;
  component: string;
  assertion: string;
  reasoning: string;
}): Promise<string> {
  if (MOCK_LLM) {
    console.log("[mock-llm] Returning stub fix for", opts.component);
    return opts.fileContent.replace(
      'className={cn("mb-8 flex flex-row gap-5 md:items-end md:justify-between"',
      'className={cn("mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between"'
    );
  }

  const response = await getClient().messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: [
              `You are a frontend bug fixer. The component "${opts.component}" in this file has a UI layout bug.`,
              "",
              `Failed assertion: "${opts.assertion}"`,
              `LLM reasoning: "${opts.reasoning}"`,
              "",
              "Fix the bug by making the SMALLEST possible change. Allowed changes:",
              "  • Tailwind / CSS class changes (most layout bugs are fixed this way)",
              "  • Restructuring existing JSX (e.g. wrapping children in a flex container)",
              "  • Changing inline styles or CSS variables",
              "",
              "Forbidden — do NOT do any of the following:",
              "  • Add new props or parameters to any component or function",
              "  • Modify TypeScript types or interfaces",
              "  • Import new libraries or components",
              "  • Change business logic, data fetching, or event handlers",
              "",
              "File content:",
              "```tsx",
              opts.fileContent,
              "```",
              "",
              "Return ONLY the corrected full file content with no explanation, no markdown fences.",
            ].join("\n"),
          },
        ],
      },
    ],
  });

  const fixed = response.content[0].type === "text" ? response.content[0].text : opts.fileContent;

  // Reject prose: if the first non-empty line doesn't look like source code,
  // Claude returned an explanation instead of the file — keep the original.
  const firstLine = fixed.trimStart().split("\n")[0].trimStart();
  const startsLikeCode = /^("|'|`|import |export |const |let |var |function |class |type |interface |\/\/|\/\*|{|<|\[|@)/.test(firstLine);
  if (!startsLikeCode) {
    console.warn(`  generateCodeFix: response looks like prose, not code — keeping original (${opts.filePath ?? opts.component})`);
    return opts.fileContent;
  }

  // Reject truncated response: if the last line has no closing delimiter the file was cut off.
  const lastLine = fixed.trimEnd().split("\n").at(-1) ?? "";
  const looksComplete = /^[}\]>;]/.test(lastLine.trimStart()) || lastLine.trimStart().startsWith("//");
  if (!looksComplete) {
    console.warn(`  generateCodeFix: response appears truncated for ${opts.filePath ?? opts.component} — keeping original`);
    return opts.fileContent;
  }

  return fixed;
}

/**
 * Given a build error and the files that were just changed, ask Claude
 * what additional edits are needed to make the build pass.
 * Returns a map of { filePath → fixedContent } for each file that needs changing.
 */
export async function generateBuildFix(opts: {
  buildError: string;
  changedFiles: Array<{ path: string; content: string }>;
}): Promise<Array<{ path: string; content: string }>> {
  if (MOCK_LLM) {
    console.log("[mock-llm] Skipping build fix generation");
    return [];
  }

  const MAX_FILE_CHARS = 3000;
  const filesSection = opts.changedFiles
    .map((f) => {
      const body = f.content.length > MAX_FILE_CHARS
        ? f.content.slice(0, MAX_FILE_CHARS) + "\n// … [truncated]"
        : f.content;
      return `### ${f.path}\n\`\`\`tsx\n${body}\n\`\`\``;
    })
    .join("\n\n");

  const response = await getClient().messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: [
              "A build command failed after applying automated UI fixes. Your task is to fix the build error.",
              "",
              "Build error output:",
              "```",
              opts.buildError.slice(0, 6000), // cap to avoid token overflow
              "```",
              "",
              "Files that were just changed (the UI fixes that caused or revealed the error):",
              "",
              filesSection,
              "",
              "Return ONLY a JSON array of files that need to be changed to fix the build.",
              "Each item: { \"path\": \"<relative file path>\", \"content\": \"<full corrected file content>\" }",
              "Return [] if no changes are needed (e.g. the error is a transient install issue).",
              "No explanation, no markdown fences — raw JSON only.",
            ].join("\n"),
          },
        ],
      },
    ],
  });

  const raw = response.content[0].type === "text" ? response.content[0].text.trim() : "[]";
  const match = raw.match(/\[[\s\S]*\]/);
  const cleaned = match ? match[0] : "[]";

  try {
    return JSON.parse(cleaned) as Array<{ path: string; content: string }>;
  } catch {
    console.error("generateBuildFix: non-JSON response:", raw.slice(0, 300));
    return [];
  }
}

export interface ExploreAction {
  /** Visible text of the element to interact with — used with getByText() */
  text: string;
  action: "click" | "fill";
  /** Value to type when action is "fill" */
  value?: string;
  reasoning: string;
}

/**
 * Given a screenshot, ask Claude which element to interact with next
 * to maximise UI coverage and surface potential bugs.
 * Returns null when there is nothing interesting left to explore.
 */
export async function suggestNextAction(imagePath: string): Promise<ExploreAction | null> {
  if (MOCK_LLM) {
    return { text: "Connect", action: "click", reasoning: "MOCK: clicking the connect button" };
  }

  const imageData = fs.readFileSync(imagePath).toString("base64");

  const response = await getClient().messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: "image/png", data: imageData },
          },
          {
            type: "text",
            text: [
              "You are an exploratory tester for a web app. Given this screenshot, choose ONE interactive element to interact with next to maximise UI coverage and surface potential bugs.",
              "",
              "Prefer: navigation links, buttons, form inputs, tabs, dropdowns, modal triggers, pagination.",
              "Avoid: elements you have likely already clicked this session, external links, destructive actions (delete, logout).",
              "",
              'Reply with JSON only — no markdown, no prose: {"text":"<visible text of element>","action":"click"|"fill","value":"<text to type if fill>","reasoning":"<one sentence>"}',
              'Return {"text":null} if nothing interesting remains.',
            ].join("\n"),
          },
        ],
      },
    ],
  });

  const raw = response.content[0].type === "text" ? response.content[0].text.trim() : '{"text":null}';
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

  try {
    const parsed = JSON.parse(cleaned);
    if (!parsed.text) return null;
    return parsed as ExploreAction;
  } catch {
    console.error("suggestNextAction: non-JSON response:", raw);
    return null;
  }
}
