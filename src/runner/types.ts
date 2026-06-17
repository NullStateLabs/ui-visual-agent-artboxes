/**
 * Authentication state to inject before a scenario or chaos session runs.
 * Generate once with `pnpm auth:save`, store as a GitHub secret in CI.
 *
 * Works with any auth provider that persists state in cookies / localStorage
 * (Privy, NextAuth, Clerk, Supabase, etc.).
 */
export interface ScenarioAuth {
  /**
   * Path to a Playwright storageState JSON file (cookies + localStorage).
   * Created by `pnpm auth:save`. Relative to the repo root.
   * In CI, decode the AUTH_STATE secret and write this file before running tests.
   */
  storageState?: string;
  /**
   * Individual localStorage key/value pairs to inject instead of a full state file.
   * Useful when you only need specific tokens (e.g. a Privy JWT from an env var).
   */
  localStorage?: Record<string, string>;
}

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
  /**
   * Auth state to inject before this scenario runs.
   * Overrides AgentConfig.auth for this specific scenario.
   * Set to null to explicitly skip auth even when AgentConfig.auth is set.
   */
  auth?: ScenarioAuth | null;
}

export interface ChaosConfig {
  /** Number of explore steps per route. Default: 12 */
  steps?: number;
  /** Viewport for chaos sessions. Default: mobile 375×812 */
  viewport?: { width: number; height: number };
  /** Only report issues at or above this severity. Default: "medium" */
  severityThreshold?: "high" | "medium" | "low";
  /**
   * "chaos"   — random clicks, battle-hardening mode. Default.
   * "explore" — strategic clicks that avoid repeating the same element.
   */
  explorationMode?: "chaos" | "explore";
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
  /** Chaos mode options. Applied to all chaos sessions. */
  chaosConfig?: ChaosConfig;
  /**
   * Default auth state applied to every scenario and chaos session.
   * Individual scenarios can override with their own auth field,
   * or opt out with auth: null.
   */
  auth?: ScenarioAuth;
}
