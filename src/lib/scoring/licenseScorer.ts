import type { PackageMetadata, CategoryScore, DependencyScoreDetail } from "@/types";
import { classifyLicense, licenseRiskScore } from "@/lib/data/licenseClassification";
import { WEIGHTS } from "./weights";

export function scoreLicenses(
  metadata: Record<string, PackageMetadata>,
  depNames: string[]
): CategoryScore {
  const details: DependencyScoreDetail[] = [];
  let hasAgpl = false;
  let hasUnknown = false;

  for (const name of depNames) {
    const meta = metadata[name];
    const license = meta?.license ?? null;
    const risk = classifyLicense(license);
    const score = licenseRiskScore(risk);
    const issues: string[] = [];

    if (risk === "network-copyleft") {
      issues.push(`AGPL license (${license}) — strong copyleft with network clause`);
      hasAgpl = true;
    } else if (risk === "strong-copyleft") {
      issues.push(`GPL license (${license}) — strong copyleft`);
    } else if (risk === "weak-copyleft") {
      issues.push(`Weak copyleft license (${license})`);
    } else if (risk === "unknown") {
      issues.push(license ? `Unrecognized license: ${license}` : "No license specified");
      hasUnknown = true;
    }

    details.push({ name, score, issues });
  }

  let score =
    depNames.length > 0
      ? Math.round(details.reduce((sum, d) => sum + d.score, 0) / details.length)
      : 100;

  if (hasAgpl) score = Math.min(score, 50);
  if (hasUnknown) score = Math.min(score, 70);

  const problemCount = details.filter((d) => d.score < 100).length;
  const summary =
    problemCount === 0
      ? "All dependencies use permissive licenses."
      : `${problemCount} dependency(ies) with non-permissive or unknown licenses.`;

  return {
    category: "license",
    label: "License Risk",
    score,
    maxScore: 100,
    weight: WEIGHTS.license,
    summary,
    details,
  };
}
