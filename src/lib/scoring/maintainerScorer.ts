import type { PackageMetadata, CategoryScore, DependencyScoreDetail } from "@/types";
import { getDepthWeight } from "@/lib/parser/lockfileParser";
import { WEIGHTS } from "./weights";

function scoreFreshness(lastPublished: string | null): number {
  if (!lastPublished) return 25;

  const now = Date.now();
  const published = new Date(lastPublished).getTime();
  const daysSince = (now - published) / (1000 * 60 * 60 * 24);

  if (daysSince < 180) return 100;
  if (daysSince < 365) return 75;
  if (daysSince < 730) return 50;
  if (daysSince < 1095) return 25;
  return 10;
}

function busFactorBonus(maintainerCount: number): number {
  if (maintainerCount >= 3) return 10;
  if (maintainerCount === 2) return 5;
  if (maintainerCount === 1) return 0;
  return -20;
}

export function scoreMaintainers(
  metadata: Record<string, PackageMetadata>,
  depNames: string[],
  depthMap?: Map<string, number>
): CategoryScore {
  const details: DependencyScoreDetail[] = [];
  
  let weightedScoreSum = 0;
  let weightSum = 0;

  for (const name of depNames) {
    const meta = metadata[name];
    const freshness = scoreFreshness(meta?.lastPublished ?? null);
    const bonus = busFactorBonus(meta?.maintainerCount ?? 0);
    const depScore = Math.max(0, Math.min(100, freshness + bonus));
    const issues: string[] = [];
    
    const depth = depthMap?.get(name) ?? 0;
    const depWeight = getDepthWeight(depth);
    const isDirect = depth === 0;

    if (freshness <= 25) {
      issues.push("Not published in over 2 years");
    } else if (freshness <= 50) {
      issues.push("Not published in over 1 year");
    }

    if ((meta?.maintainerCount ?? 0) <= 1) {
      issues.push("Single maintainer (bus factor risk)");
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

  const staleCount = details.filter((d) => d.score < 50).length;
  const directStaleCount = details.filter((d, i) => {
    const name = depNames[i];
    return d.score < 50 && (depthMap?.get(name) ?? 0) === 0;
  }).length;

  let summary: string;
  if (staleCount === 0) {
    summary = "Dependencies are actively maintained.";
  } else if (directStaleCount > 0) {
    summary = `${staleCount} dependency(ies) appear unmaintained or have low bus factor (${directStaleCount} direct).`;
  } else {
    summary = `${staleCount} transitive dependency(ies) appear unmaintained or have low bus factor.`;
  }

  return {
    category: "maintainer",
    label: "Maintainer Activity",
    score,
    maxScore: 100,
    weight: WEIGHTS.maintainer,
    summary,
    details,
  };
}
