export type { Dependency, ParsedPackageJson } from "@/lib/parser/types";

export interface Vulnerability {
  id: string;
  summary?: string;
  severity?: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  cvssScore?: number;
  aliases?: string[];
}

export interface PackageMetadata {
  name: string;
  license: string | null;
  lastPublished: string | null;
  maintainerCount: number;
  description?: string;
  directDeps?: string[];
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
