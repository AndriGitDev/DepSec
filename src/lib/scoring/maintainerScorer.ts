import type { PackageMetadata, CategoryScore, DependencyScoreDetail } from "@/types";
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
  depNames: string[]
): CategoryScore {
  const details: DependencyScoreDetail[] = [];

  for (const name of depNames) {
    const meta = metadata[name];
    const freshness = scoreFreshness(meta?.lastPublished ?? null);
    const bonus = busFactorBonus(meta?.maintainerCount ?? 0);
    const depScore = Math.max(0, Math.min(100, freshness + bonus));
    const issues: string[] = [];

    if (freshness <= 25) {
      issues.push("Not published in over 2 years");
    } else if (freshness <= 50) {
      issues.push("Not published in over 1 year");
    }

    if ((meta?.maintainerCount ?? 0) <= 1) {
      issues.push("Single maintainer (bus factor risk)");
    }

    details.push({ name, score: depScore, issues });
  }

  const score =
    depNames.length > 0
      ? Math.round(details.reduce((sum, d) => sum + d.score, 0) / details.length)
      : 100;

  const staleCount = details.filter((d) => d.score < 50).length;
  const summary =
    staleCount === 0
      ? "Dependencies are actively maintained."
      : `${staleCount} dependency(ies) appear unmaintained or have low bus factor.`;

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
