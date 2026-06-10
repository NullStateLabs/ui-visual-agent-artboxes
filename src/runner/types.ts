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
}
