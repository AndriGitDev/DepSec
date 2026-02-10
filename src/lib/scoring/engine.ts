import type {
  ParsedPackageJson,
  Vulnerability,
  PackageMetadata,
  CompositeScore,
  CategoryScore,
} from "@/types";
import type { ParsedLockfile } from "@/lib/parser/lockfileParser";
import { scoreVulnerabilities } from "./vulnerabilityScorer";
import { scoreHygiene } from "./hygieneScorer";
import { scoreLicenses } from "./licenseScorer";
import { scoreMaintainers } from "./maintainerScorer";
import { scorePopularity } from "./popularityScorer";
import { scoreTyposquatting } from "./typosquatScorer";
import { getGrade } from "./weights";

/**
 * Build depth map from parsed dependencies
 */
function buildDepthMap(parsed: ParsedPackageJson): Map<string, number> {
  const depthMap = new Map<string, number>();
  for (const dep of parsed.dependencies) {
    depthMap.set(dep.name, dep.depth ?? 0);
  }
  return depthMap;
}

export function computeScore(
  parsed: ParsedPackageJson,
  vulnerabilities: Record<string, Vulnerability[]>,
  metadata: Record<string, PackageMetadata>,
  downloadCounts: Record<string, number>,
  lockfile?: ParsedLockfile | null
): CompositeScore {
  // Build depth map for weighting
  const depthMap = buildDepthMap(parsed);
  
  // Get all dependency names
  const depNames = parsed.dependencies.map((d) => d.name);
  
  // Separate direct and transitive for targeted scoring
  // (Reserved for future category-specific scoring enhancements)
  const _directDeps = parsed.dependencies
    .filter(d => d.isDirect !== false && (d.depth ?? 0) === 0)
    .map(d => d.name);
  
  const _transitiveDeps = parsed.dependencies
    .filter(d => d.isDirect === false || (d.depth ?? 0) > 0)
    .map(d => d.name);
  
  // Suppress unused warnings - these will be used for enhanced scoring
  void _directDeps;
  void _transitiveDeps;

  const categories: CategoryScore[] = [
    scoreVulnerabilities(vulnerabilities, depNames, depthMap),
    scoreHygiene(parsed, lockfile),
    scoreLicenses(metadata, depNames, depthMap),
    scoreMaintainers(metadata, depNames, depthMap),
    scorePopularity(downloadCounts, depNames, depthMap),
    scoreTyposquatting(depNames, depthMap),
  ];

  const overall = Math.floor(
    categories.reduce((sum, cat) => sum + cat.score * cat.weight, 0)
  );

  return {
    overall,
    grade: getGrade(overall),
    categories,
  };
}
