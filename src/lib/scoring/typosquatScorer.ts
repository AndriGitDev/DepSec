import { distance } from "fastest-levenshtein";
import type { CategoryScore, DependencyScoreDetail } from "@/types";
import { popularPackages } from "@/lib/data/popularPackages";
import { WEIGHTS } from "./weights";

const popularSet = new Set(popularPackages);

export function scoreTyposquatting(depNames: string[]): CategoryScore {
  const details: DependencyScoreDetail[] = [];
  let hasHighRisk = false;

  for (const name of depNames) {
    // Skip if it's a known popular package
    if (popularSet.has(name)) {
      details.push({ name, score: 100, issues: [] });
      continue;
    }

    // Skip scoped packages for typosquat check (they have org namespaces)
    if (name.startsWith("@")) {
      details.push({ name, score: 100, issues: [] });
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
    } else if (minDist === 2 && name.length > 4) {
      issues.push(`Similar to popular package "${closestPkg}" (2 character difference)`);
      depScore = 50;
    }

    details.push({ name, score: depScore, issues });
  }

  const score =
    depNames.length > 0
      ? Math.round(details.reduce((sum, d) => sum + d.score, 0) / details.length)
      : 100;

  const flaggedCount = details.filter((d) => d.score < 100).length;
  const summary =
    flaggedCount === 0
      ? "No potential typosquatting detected."
      : hasHighRisk
        ? `${flaggedCount} dependency(ies) flagged as potential typosquats — verify immediately!`
        : `${flaggedCount} dependency(ies) have names similar to popular packages.`;

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
