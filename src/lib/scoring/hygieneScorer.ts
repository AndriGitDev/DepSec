import type { ParsedPackageJson, CategoryScore, DependencyScoreDetail } from "@/types";
import { WEIGHTS } from "./weights";

function scoreVersionSpecifier(spec: string): number {
  const trimmed = spec.trim();

  // Exact version
  if (/^\d+\.\d+\.\d+$/.test(trimmed)) return 100;
  // Tilde
  if (trimmed.startsWith("~")) return 75;
  // Caret
  if (trimmed.startsWith("^")) return 60;
  // Range
  if (trimmed.includes(">=") || trimmed.includes("<=") || trimmed.includes("-")) return 40;
  // Git URL or file path
  if (
    trimmed.startsWith("git") ||
    trimmed.startsWith("http") ||
    trimmed.startsWith("file:") ||
    trimmed.includes("/")
  )
    return 10;
  // Wildcard or latest
  if (trimmed === "*" || trimmed === "latest" || trimmed === "") return 0;

  return 50;
}

function scoreDepCount(count: number): number {
  if (count <= 20) return 100;
  if (count <= 50) return 80;
  if (count <= 100) return 60;
  if (count <= 200) return 40;
  return 20;
}

function scoreSeparation(prodCount: number, devCount: number): number {
  if (prodCount > 0 && devCount > 0) return 100;
  if (prodCount > 0 && devCount === 0) return 50;
  return 70;
}

export function scoreHygiene(parsed: ParsedPackageJson): CategoryScore {
  const details: DependencyScoreDetail[] = [];

  for (const dep of parsed.dependencies) {
    const vScore = scoreVersionSpecifier(dep.versionSpecifier);
    const issues: string[] = [];

    if (vScore <= 0) issues.push("Uses wildcard or 'latest' — highly unpinned");
    else if (vScore <= 10) issues.push("Uses git/URL dependency");
    else if (vScore <= 40) issues.push("Uses loose version range");
    else if (vScore <= 60) issues.push("Uses caret (^) range");
    else if (vScore <= 75) issues.push("Uses tilde (~) range");

    details.push({ name: dep.name, score: vScore, issues });
  }

  const versionScore =
    details.length > 0
      ? Math.round(details.reduce((sum, d) => sum + d.score, 0) / details.length)
      : 100;

  const depCountScore = scoreDepCount(parsed.totalCount);
  const separationScore = scoreSeparation(parsed.prodCount, parsed.devCount);

  const score = Math.round(
    versionScore * 0.5 + depCountScore * 0.3 + separationScore * 0.2
  );

  const summaryParts: string[] = [];
  if (versionScore < 70) summaryParts.push("many dependencies use loose version ranges");
  if (depCountScore < 60) summaryParts.push(`${parsed.totalCount} total dependencies is high`);
  if (separationScore < 100) summaryParts.push("consider separating dev dependencies");

  const summary =
    summaryParts.length > 0
      ? `Issues: ${summaryParts.join("; ")}.`
      : "Good dependency hygiene — versions are well-pinned.";

  return {
    category: "hygiene",
    label: "Dependency Hygiene",
    score,
    maxScore: 100,
    weight: WEIGHTS.hygiene,
    summary,
    details,
  };
}
