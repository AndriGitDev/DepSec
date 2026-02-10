import type { CategoryScore, DependencyScoreDetail } from "@/types";
import { getDepthWeight } from "@/lib/parser/lockfileParser";
import { WEIGHTS } from "./weights";

function scoreDownloads(monthlyDownloads: number): number {
  if (monthlyDownloads >= 1_000_000) return 100;
  if (monthlyDownloads >= 100_000) return 85;
  if (monthlyDownloads >= 10_000) return 70;
  if (monthlyDownloads >= 1_000) return 50;
  if (monthlyDownloads >= 100) return 30;
  return 10;
}

export function scorePopularity(
  downloadCounts: Record<string, number>,
  depNames: string[],
  depthMap?: Map<string, number>
): CategoryScore {
  const details: DependencyScoreDetail[] = [];
  
  let weightedScoreSum = 0;
  let weightSum = 0;

  for (const name of depNames) {
    const downloads = downloadCounts[name] ?? 0;
    const depScore = scoreDownloads(downloads);
    const issues: string[] = [];
    
    const depth = depthMap?.get(name) ?? 0;
    const depWeight = getDepthWeight(depth);
    const isDirect = depth === 0;

    if (downloads === 0) {
      issues.push("Zero downloads — may be unpublished or very new");
    } else if (downloads < 100) {
      issues.push(`Very low downloads (${downloads}/month)`);
    } else if (downloads < 1000) {
      issues.push(`Low downloads (${downloads.toLocaleString()}/month)`);
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

  const lowCount = details.filter((d) => d.score < 50).length;
  const directLowCount = details.filter((d, i) => {
    const name = depNames[i];
    return d.score < 50 && (depthMap?.get(name) ?? 0) === 0;
  }).length;

  let summary: string;
  if (lowCount === 0) {
    summary = "All dependencies have healthy download counts.";
  } else if (directLowCount > 0) {
    summary = `${lowCount} dependency(ies) with low download counts (${directLowCount} direct) — review these carefully.`;
  } else {
    summary = `${lowCount} transitive dependency(ies) with low download counts.`;
  }

  return {
    category: "popularity",
    label: "Download Popularity",
    score,
    maxScore: 100,
    weight: WEIGHTS.popularity,
    summary,
    details,
  };
}
