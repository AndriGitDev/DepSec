import { distance } from "fastest-levenshtein";
import type { CategoryScore, DependencyScoreDetail } from "@/types";
import { popularPackages } from "@/lib/data/popularPackages";
import { getDepthWeight } from "@/lib/parser/lockfileParser";
import { WEIGHTS } from "./weights";

const popularSet = new Set(popularPackages);

export function scoreTyposquatting(
  depNames: string[],
  depthMap?: Map<string, number>
): CategoryScore {
  const details: DependencyScoreDetail[] = [];
  let hasHighRisk = false;
  let hasHighRiskDirect = false;
  
  let weightedScoreSum = 0;
  let weightSum = 0;

  for (const name of depNames) {
    const depth = depthMap?.get(name) ?? 0;
    const depWeight = getDepthWeight(depth);
    const isDirect = depth === 0;

    // Skip if it's a known popular package
    if (popularSet.has(name)) {
      details.push({ name, score: 100, issues: [] });
      weightedScoreSum += 100 * depWeight;
      weightSum += depWeight;
      continue;
    }

    // Skip scoped packages for typosquat check (they have org namespaces)
    if (name.startsWith("@")) {
      details.push({ name, score: 100, issues: [] });
      weightedScoreSum += 100 * depWeight;
      weightSum += depWeight;
      continue;
    }

    let minDist = Infinity;
    let closestPkg = "";

    for (const popular of popularPackages) {
      // Only compare against similarly-lengthed names for perf
      if (Math.abs(popular.length - name.length) > 2) continue;

      const d = distance(name, popular);
      if (d < minDist) {
        minDist = d;
        closestPkg = popular;
      }
      if (d === 1) break; // Found closest possible
    }

    const issues: string[] = [];
    let depScore = 100;

    if (minDist === 1) {
      issues.push(`Very similar to popular package "${closestPkg}" (1 character difference)`);
      depScore = 0;
      hasHighRisk = true;
      if (isDirect) hasHighRiskDirect = true;
    } else if (minDist === 2 && name.length > 4) {
      issues.push(`Similar to popular package "${closestPkg}" (2 character difference)`);
      depScore = 50;
    }

    // Add depth info for transitive deps with issues
    if (!isDirect && issues.length > 0) {
      issues.push(`transitive (depth ${depth})`);
    }

    details.push({ name, score: depScore, issues });
    weightedScoreSum += depScore * depWeight;
    weightSum += depWeight;
  }

  const score = weightSum > 0
    ? Math.round(weightedScoreSum / weightSum)
    : 100;

  const flaggedCount = details.filter((d) => d.score < 100).length;
  const directFlaggedCount = details.filter((d, i) => {
    const name = depNames[i];
    return d.score < 100 && (depthMap?.get(name) ?? 0) === 0;
  }).length;

  let summary: string;
  if (flaggedCount === 0) {
    summary = "No potential typosquatting detected.";
  } else if (hasHighRiskDirect) {
    summary = `${flaggedCount} dependency(ies) flagged as potential typosquats (${directFlaggedCount} direct) — verify immediately!`;
  } else if (hasHighRisk) {
    summary = `${flaggedCount} transitive dependency(ies) flagged as potential typosquats — verify these packages.`;
  } else if (directFlaggedCount > 0) {
    summary = `${flaggedCount} dependency(ies) have names similar to popular packages (${directFlaggedCount} direct).`;
  } else {
    summary = `${flaggedCount} transitive dependency(ies) have names similar to popular packages.`;
  }

  return {
    category: "typosquat",
    label: "Typosquatting Detection",
    score,
    maxScore: 100,
    weight: WEIGHTS.typosquat,
    summary,
    details,
  };
}
