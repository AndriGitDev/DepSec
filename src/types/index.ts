export type { Dependency, ParsedPackageJson } from "@/lib/parser/types";

export interface RemediationHint {
  fixedVersion?: string;        // Version that fixes the vulnerability
  upgradeFrom?: string;         // Current version
  upgradePath?: string[];       // For transitive deps: ["parent-pkg", "child-pkg"]
  isBreaking?: boolean;         // Whether upgrade is a major version change
  recommendation?: string;      // Human-readable recommendation
}

export interface Vulnerability {
  id: string;
  summary?: string;
  severity?: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  cvssScore?: number;
  aliases?: string[];
  affectedVersions?: string;    // Version range that is affected
  fixedVersion?: string;        // Version that fixes the issue
  remediation?: RemediationHint;
}

export interface PackageMetadata {
  name: string;
  license: string | null;
  lastPublished: string | null;
  maintainerCount: number;
  description?: string;
  directDeps?: string[];
  latestVersion?: string;       // Latest available version
}

export interface CategoryScore {
  category: string;
  label: string;
  score: number;
  maxScore: number;
  weight: number;
  summary: string;
  details: DependencyScoreDetail[];
}

export interface DependencyScoreDetail {
  name: string;
  score: number;
  issues: string[];
}

export interface CompositeScore {
  overall: number;
  grade: string;
  categories: CategoryScore[];
}

export type AnalysisStatus =
  | "idle"
  | "parsing"
  | "fetching"
  | "scoring"
  | "complete"
  | "error";

export type RiskLevel = "safe" | "warning" | "critical";
