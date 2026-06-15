export type StepAction =
  | { action: "click";   selector: string }
  | { action: "hover";   selector: string }
  | { action: "fill";    selector: string; value: string }
  | { action: "wait";    ms: number }
  | { action: "scroll";  selector: string }
  | { action: "press";   selector: string; key: string };

export interface Scenario {
  /** Human-readable label used in test names and bug tickets */
  label: string;
  /** Path relative to baseURL, e.g. "/" or "/collections/abc" */
  url: string;
  /**
   * Path to the source file in the target repo that owns this page's layout.
   * e.g. "app/upcoming/page.tsx" or "src/pages/collections/index.tsx"
   * Required for the fix agent to auto-fix detected issues.
   * If omitted, issues are logged as tickets but cannot be auto-fixed.
   */
  filePath?: string;
  /** Interactions to perform before taking the screenshot */
  steps?: StepAction[];
  /** Viewport to use for this scenario. Defaults to mobile (375×812) */
  viewport?: { width: number; height: number };
  /** Issue IDs from common-ui-issues.ts to skip for this scenario */
  skipIssueIds?: number[];
  /** Only report issues at or above this severity. Defaults to "low" */
  severityThreshold?: "high" | "medium" | "low";
}

export interface AgentConfig {
  scenarios: Scenario[];
  /**
   * Issue IDs from common-ui-issues.ts to skip across ALL scenarios.
   * Use for known false positives that apply to the whole app (design system
   * choices, rendering artefacts, intentional patterns that always fire).
   * Per-scenario skipIssueIds are merged on top of these.
   */
  globalSkipIssueIds?: number[];
  /**
   * Routes the chaos runner can explore. Falls back to sitemap.xml discovery
   * if omitted, then to ["/"] if the sitemap is unreachable.
   */
  routes?: string[];
}
