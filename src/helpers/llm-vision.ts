import Anthropic from "@anthropic-ai/sdk";
import * as fs from "fs";

// Set MOCK_LLM=true to skip the real API call (useful for testing the pipeline without an API key).
// Mock always returns pass:false so the full failure path (Postgres ticket) can be verified.
const MOCK_LLM = process.env.MOCK_LLM === "true";

function getClient(): Anthropic {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

export async function analyzeScreenshot(opts: {
  imagePath: string;
  assertion: string;
}): Promise<{ pass: boolean; reasoning: string }> {
  if (MOCK_LLM) {
    console.log("[mock-llm] Skipping real API call, returning hardcoded fail");
    return {
      pass: false,
      reasoning:
        "MOCK: title block and action link appear side-by-side instead of stacked vertically",
    };
  }

  const imageData = fs.readFileSync(opts.imagePath).toString("base64");

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
              "You are a UI layout inspector. Analyze the screenshot and answer this assertion:",
              `"${opts.assertion}"`,
              "",
              "Reply with JSON only — no markdown, no prose:",
              '{ "pass": true | false, "reasoning": "one sentence" }',
            ].join("\n"),
          },
        ],
      },
    ],
  });

  const raw = response.content[0].type === "text" ? response.content[0].text.trim() : "{}";
  const text = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  try {
    return JSON.parse(text);
  } catch {
    return { pass: false, reasoning: `LLM returned non-JSON: ${raw}` };
  }
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
    // Stub: re-add the Tailwind responsive classes that were removed
    return opts.fileContent.replace(
      'className={cn("mb-8 flex flex-col gap-5"',
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
