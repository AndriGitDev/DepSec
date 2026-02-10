import type { PackageMetadata, CategoryScore, DependencyScoreDetail } from "@/types";
import { classifyLicense, licenseRiskScore } from "@/lib/data/licenseClassification";
import { getDepthWeight } from "@/lib/parser/lockfileParser";
import { WEIGHTS } from "./weights";

export function scoreLicenses(
  metadata: Record<string, PackageMetadata>,
  depNames: string[],
  depthMap?: Map<string, number>
): CategoryScore {
  const details: DependencyScoreDetail[] = [];
  let hasAgpl = false;
  let hasUnknown = false;
  let hasAgplDirect = false;

  let weightedScoreSum = 0;
  let weightSum = 0;

  for (const name of depNames) {
    const meta = metadata[name];
    const license = meta?.license ?? null;
    const risk = classifyLicense(license);
    const score = licenseRiskScore(risk);
    const issues: string[] = [];
    
    const depth = depthMap?.get(name) ?? 0;
    const depWeight = getDepthWeight(depth);
    const isDirect = depth === 0;

    if (risk === "network-copyleft") {
      issues.push(`AGPL license (${license}) — strong copyleft with network clause`);
      hasAgpl = true;
      if (isDirect) hasAgplDirect = true;
    } else if (risk === "strong-copyleft") {
      issues.push(`GPL license (${license}) — strong copyleft`);
    } else if (risk === "weak-copyleft") {
      issues.push(`Weak copyleft license (${license})`);
    } else if (risk === "unknown") {
      issues.push(license ? `Unrecognized license: ${license}` : "No license specified");
      hasUnknown = true;
    }

    // Add depth info for transitive deps with issues
    if (!isDirect && issues.length > 0) {
      issues.push(`transitive (depth ${depth})`);
    }

    details.push({ name, score, issues });
    weightedScoreSum += score * depWeight;
    weightSum += depWeight;
  }

  let score = weightSum > 0
    ? Math.round(weightedScoreSum / weightSum)
    : 100;

  // AGPL in direct deps is more serious
  if (hasAgplDirect) {
    score = Math.min(score, 40);
  } else if (hasAgpl) {
    score = Math.min(score, 55);
  }
  if (hasUnknown) score = Math.min(score, 70);

  const problemCount = details.filter((d) => d.score < 100).length;
  const directProblemCount = details.filter((d, i) => {
    const name = depNames[i];
    return d.score < 100 && (depthMap?.get(name) ?? 0) === 0;
  }).length;

  let summary: string;
  if (problemCount === 0) {
    summary = "All dependencies use permissive licenses.";
  } else if (directProblemCount > 0) {
    summary = `${problemCount} dependency(ies) with non-permissive or unknown licenses (${directProblemCount} direct).`;
  } else {
    summary = `${problemCount} transitive dependency(ies) with non-permissive or unknown licenses.`;
  }

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
