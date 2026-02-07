import type { CategoryScore, DependencyScoreDetail } from "@/types";
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
  depNames: string[]
): CategoryScore {
  const details: DependencyScoreDetail[] = [];

  for (const name of depNames) {
    const downloads = downloadCounts[name] ?? 0;
    const depScore = scoreDownloads(downloads);
    const issues: string[] = [];

    if (downloads === 0) {
      issues.push("Zero downloads — may be unpublished or very new");
    } else if (downloads < 100) {
      issues.push(`Very low downloads (${downloads}/month)`);
    } else if (downloads < 1000) {
      issues.push(`Low downloads (${downloads.toLocaleString()}/month)`);
    }

    details.push({ name, score: depScore, issues });
  }

  const score =
    depNames.length > 0
      ? Math.round(details.reduce((sum, d) => sum + d.score, 0) / details.length)
      : 100;

  const lowCount = details.filter((d) => d.score < 50).length;
  const summary =
    lowCount === 0
      ? "All dependencies have healthy download counts."
      : `${lowCount} dependency(ies) with low download counts — review these carefully.`;

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
