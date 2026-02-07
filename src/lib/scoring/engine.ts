import type {
  ParsedPackageJson,
  Vulnerability,
  PackageMetadata,
  CompositeScore,
  CategoryScore,
} from "@/types";
import { scoreVulnerabilities } from "./vulnerabilityScorer";
import { scoreHygiene } from "./hygieneScorer";
import { scoreLicenses } from "./licenseScorer";
import { scoreMaintainers } from "./maintainerScorer";
import { scorePopularity } from "./popularityScorer";
import { scoreTyposquatting } from "./typosquatScorer";
import { getGrade } from "./weights";

export function computeScore(
  parsed: ParsedPackageJson,
  vulnerabilities: Record<string, Vulnerability[]>,
  metadata: Record<string, PackageMetadata>,
  downloadCounts: Record<string, number>
): CompositeScore {
  const depNames = parsed.dependencies.map((d) => d.name);

  const categories: CategoryScore[] = [
    scoreVulnerabilities(vulnerabilities, depNames),
    scoreHygiene(parsed),
    scoreLicenses(metadata, depNames),
    scoreMaintainers(metadata, depNames),
    scorePopularity(downloadCounts, depNames),
    scoreTyposquatting(depNames),
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
