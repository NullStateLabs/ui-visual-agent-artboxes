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
              "You are a UI quality inspector. Carefully examine the screenshot and check it against the following list of common UI issues.",
              "",
              "Only report issues you can CLEARLY SEE in the screenshot. Do not guess.",
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
  filePath: string;
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
    max_tokens: 2048,
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

  return response.content[0].type === "text" ? response.content[0].text : opts.fileContent;
}
