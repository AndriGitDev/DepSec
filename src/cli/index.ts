#!/usr/bin/env node

/**
 * DepSec CLI - Dependency Security Analyzer
 * 
 * Usage:
 *   npx depsec --ci package.json [--lock package-lock.json] [--fail-under 70]
 *   npx depsec package.json --json
 *   npx depsec package.json --sbom
 */

import * as fs from "fs";
import * as path from "path";
import { parsePackageJson } from "../lib/parser/packageJsonParser";
import { parseLockfile } from "../lib/parser/lockfileParser";
import type { ParsedPackageJson, Vulnerability, PackageMetadata, CompositeScore } from "../types";
import type { ParsedLockfile } from "../lib/parser/lockfileParser";
import * as semver from "semver";

// CLI output result interface
interface CLIResult {
  success: boolean;
  score: number;
  grade: string;
  threshold: number;
  vulnerabilities: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  dependencies: {
    total: number;
    direct: number;
    transitive: number;
  };
  categories: Array<{
    name: string;
    score: number;
    weight: number;
  }>;
  timestamp: string;
  packageName?: string;
}

// SBOM (CycloneDX) interface
interface CycloneDXComponent {
  type: string;
  name: string;
  version: string;
  purl?: string;
  licenses?: Array<{ license: { id?: string; name?: string } }>;
}

interface CycloneDXVulnerability {
  id: string;
  source?: { name: string; url?: string };
  ratings?: Array<{ severity: string; score?: number }>;
  description?: string;
  affects?: Array<{ ref: string }>;
}

interface CycloneDXSBOM {
  bomFormat: string;
  specVersion: string;
  serialNumber: string;
  version: number;
  metadata: {
    timestamp: string;
    tools?: Array<{ vendor: string; name: string; version: string }>;
    component?: { type: string; name: string; version?: string };
  };
  components: CycloneDXComponent[];
  dependencies?: Array<{ ref: string; dependsOn?: string[] }>;
  vulnerabilities?: CycloneDXVulnerability[];
}

function printUsage() {
  console.log(`
DepSec CLI - Dependency Security Analyzer

Usage:
  depsec [options] <package.json>

Options:
  --ci                  Run in CI mode (JSON output, exit codes)
  --lock <file>         Path to package-lock.json for transitive deps
  --fail-under <score>  Exit with code 1 if score is below threshold (default: 0)
  --json                Output results as JSON
  --sbom                Output CycloneDX SBOM format
  --help, -h            Show this help message

Examples:
  depsec package.json
  depsec --ci package.json --fail-under 70
  depsec package.json --lock package-lock.json --json
  depsec package.json --sbom > sbom.cdx.json
`);
}

function resolveVersion(specifier: string): string {
  try {
    const min = semver.minVersion(specifier);
    if (min) return min.version;
  } catch {
    // ignore
  }
  return specifier.replace(/^[\^~>=<\s]+/, "").split(/\s/)[0] || "0.0.0";
}

async function fetchVulnerabilities(
  packages: Array<{ name: string; version: string }>
): Promise<Record<string, Vulnerability[]>> {
  const results: Record<string, Vulnerability[]> = {};
  
  // Batch query OSV
  const batchSize = 100;
  for (let i = 0; i < packages.length; i += batchSize) {
    const batch = packages.slice(i, i + batchSize);
    const queries = batch.map(pkg => ({
      package: { name: pkg.name, ecosystem: "npm" },
      version: pkg.version,
    }));

    try {
      const res = await fetch("https://api.osv.dev/v1/querybatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ queries }),
        signal: AbortSignal.timeout(30000),
      });

      if (!res.ok) continue;

      const data = await res.json();
      
      for (let j = 0; j < batch.length; j++) {
        const vulns = data.results?.[j]?.vulns ?? [];
        results[batch[j].name] = vulns.map((v: { id: string; summary?: string; database_specific?: { severity?: string } }) => ({
          id: v.id,
          summary: v.summary,
          severity: classifySeverity(v),
        }));
      }
    } catch (err) {
      console.error(`Warning: Failed to fetch vulnerabilities for batch ${i}:`, err);
    }
  }

  return results;
}

function classifySeverity(v: { id: string; database_specific?: { severity?: string } }): "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" {
  const dbSev = v.database_specific?.severity?.toUpperCase();
  if (dbSev === "CRITICAL") return "CRITICAL";
  if (dbSev === "HIGH") return "HIGH";
  if (dbSev === "MEDIUM" || dbSev === "MODERATE") return "MEDIUM";
  if (dbSev === "LOW") return "LOW";
  return "MEDIUM"; // Default
}

async function fetchMetadata(depNames: string[]): Promise<Record<string, PackageMetadata>> {
  const results: Record<string, PackageMetadata> = {};
  
  const batchSize = 20;
  for (let i = 0; i < depNames.length; i += batchSize) {
    const batch = depNames.slice(i, i + batchSize);
    
    await Promise.all(batch.map(async (name) => {
      try {
        const res = await fetch(`https://registry.npmjs.org/${encodeURIComponent(name)}`, {
          headers: { Accept: "application/json" },
          signal: AbortSignal.timeout(10000),
        });
        
        if (!res.ok) return;
        
        const data = await res.json();
        const latest = data["dist-tags"]?.latest;
        const latestData = latest ? data.versions?.[latest] : null;
        
        results[name] = {
          name,
          license: latestData?.license || data.license || null,
          lastPublished: data.time?.[latest] || null,
          maintainerCount: data.maintainers?.length || 0,
          latestVersion: latest,
        };
      } catch {
        // Skip failed fetches
      }
    }));
  }

  return results;
}

function computeSimpleScore(
  parsed: ParsedPackageJson,
  vulns: Record<string, Vulnerability[]>,
  metadata: Record<string, PackageMetadata>
): CompositeScore {
  // Simple scoring without the full engine (for CLI mode)
  let vulnScore = 100;
  let licenseScore = 100;
  let maintenanceScore = 100;

  const vulnCounts = { critical: 0, high: 0, medium: 0, low: 0 };
  
  for (const dep of parsed.dependencies) {
    const depVulns = vulns[dep.name] ?? [];
    for (const v of depVulns) {
      if (v.severity === "CRITICAL") vulnCounts.critical++;
      else if (v.severity === "HIGH") vulnCounts.high++;
      else if (v.severity === "MEDIUM") vulnCounts.medium++;
      else vulnCounts.low++;
    }
  }

  // Vulnerability scoring
  vulnScore = Math.max(0, 100 - vulnCounts.critical * 25 - vulnCounts.high * 15 - vulnCounts.medium * 5 - vulnCounts.low * 2);
  if (vulnCounts.critical > 0) vulnScore = Math.min(vulnScore, 30);
  else if (vulnCounts.high > 0) vulnScore = Math.min(vulnScore, 60);

  // License scoring (simple check)
  const badLicenses = Object.values(metadata).filter(m => {
    const lic = m.license?.toUpperCase() || "";
    return lic.includes("GPL") || lic.includes("AGPL") || !m.license;
  }).length;
  licenseScore = Math.max(0, 100 - badLicenses * 10);

  // Maintenance scoring
  const staleCount = Object.values(metadata).filter(m => {
    if (!m.lastPublished) return true;
    const daysSince = (Date.now() - new Date(m.lastPublished).getTime()) / (1000 * 60 * 60 * 24);
    return daysSince > 365;
  }).length;
  maintenanceScore = Math.max(0, 100 - staleCount * 5);

  const overall = Math.round(vulnScore * 0.4 + licenseScore * 0.3 + maintenanceScore * 0.3);
  
  let grade = "F";
  if (overall >= 90) grade = "A+";
  else if (overall >= 80) grade = "A";
  else if (overall >= 70) grade = "B";
  else if (overall >= 60) grade = "C";
  else if (overall >= 40) grade = "D";

  return {
    overall,
    grade,
    categories: [
      { category: "vulnerabilities", label: "Vulnerabilities", score: vulnScore, maxScore: 100, weight: 0.4, summary: "", details: [] },
      { category: "license", label: "Licenses", score: licenseScore, maxScore: 100, weight: 0.3, summary: "", details: [] },
      { category: "maintenance", label: "Maintenance", score: maintenanceScore, maxScore: 100, weight: 0.3, summary: "", details: [] },
    ],
  };
}

function generateSBOM(
  parsed: ParsedPackageJson,
  metadata: Record<string, PackageMetadata>,
  vulns: Record<string, Vulnerability[]>,
  _lockfile?: ParsedLockfile // Reserved for future dependency tree enhancement
): CycloneDXSBOM {
  const components: CycloneDXComponent[] = [];
  const dependencies: Array<{ ref: string; dependsOn?: string[] }> = [];
  const vulnerabilities: CycloneDXVulnerability[] = [];
  const processedVulns = new Set<string>();

  // Add root component
  if (parsed.name) {
    dependencies.push({
      ref: `pkg:npm/${parsed.name}@${parsed.version || "0.0.0"}`,
      dependsOn: parsed.dependencies
        .filter(d => d.isDirect !== false)
        .map(d => `pkg:npm/${d.name}@${d.resolvedVersion || resolveVersion(d.versionSpecifier)}`),
    });
  }

  for (const dep of parsed.dependencies) {
    const version = dep.resolvedVersion || resolveVersion(dep.versionSpecifier);
    const purl = `pkg:npm/${dep.name}@${version}`;
    const meta = metadata[dep.name];

    components.push({
      type: "library",
      name: dep.name,
      version,
      purl,
      licenses: meta?.license ? [{ license: { id: meta.license } }] : undefined,
    });

    // Add dependency tree if available
    if (dep.dependencies && dep.dependencies.length > 0) {
      dependencies.push({
        ref: purl,
        dependsOn: dep.dependencies.map(d => {
          const childDep = parsed.dependencies.find(pd => pd.name === d);
          const childVersion = childDep?.resolvedVersion || "0.0.0";
          return `pkg:npm/${d}@${childVersion}`;
        }),
      });
    }

    // Add vulnerabilities
    const depVulns = vulns[dep.name] ?? [];
    for (const v of depVulns) {
      if (processedVulns.has(v.id)) continue;
      processedVulns.add(v.id);

      vulnerabilities.push({
        id: v.id,
        source: { name: "OSV", url: `https://osv.dev/vulnerability/${v.id}` },
        ratings: v.severity ? [{ severity: v.severity.toLowerCase(), score: v.cvssScore }] : undefined,
        description: v.summary,
        affects: [{ ref: purl }],
      });
    }
  }

  return {
    bomFormat: "CycloneDX",
    specVersion: "1.5",
    serialNumber: `urn:uuid:${crypto.randomUUID()}`,
    version: 1,
    metadata: {
      timestamp: new Date().toISOString(),
      tools: [{ vendor: "DepSec", name: "depsec", version: "0.1.0" }],
      component: parsed.name ? { type: "application", name: parsed.name, version: parsed.version } : undefined,
    },
    components,
    dependencies: dependencies.length > 0 ? dependencies : undefined,
    vulnerabilities: vulnerabilities.length > 0 ? vulnerabilities : undefined,
  };
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    printUsage();
    process.exit(0);
  }

  // Parse arguments
  let packageJsonPath: string | null = null;
  let lockfilePath: string | null = null;
  let threshold = 0;
  let jsonOutput = false;
  let sbomOutput = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--ci") {
      jsonOutput = true; // CI mode enables JSON output
    } else if (arg === "--json") {
      jsonOutput = true;
    } else if (arg === "--sbom") {
      sbomOutput = true;
    } else if (arg === "--lock" && args[i + 1]) {
      lockfilePath = args[++i];
    } else if (arg === "--fail-under" && args[i + 1]) {
      threshold = parseInt(args[++i], 10);
    } else if (!arg.startsWith("-")) {
      packageJsonPath = arg;
    }
  }

  if (!packageJsonPath) {
    console.error("Error: No package.json path provided");
    printUsage();
    process.exit(1);
  }

  // Read and parse package.json
  let packageJsonContent: string;
  try {
    packageJsonContent = fs.readFileSync(path.resolve(packageJsonPath), "utf-8");
  } catch {
    console.error(`Error: Could not read ${packageJsonPath}`);
    process.exit(1);
  }

  let parsed: ParsedPackageJson;
  try {
    parsed = parsePackageJson(packageJsonContent);
  } catch (err) {
    console.error(`Error: Invalid package.json - ${err instanceof Error ? err.message : err}`);
    process.exit(1);
  }

  // Read lockfile if provided
  let lockfile: ParsedLockfile | undefined;
  if (lockfilePath) {
    try {
      const lockfileContent = fs.readFileSync(path.resolve(lockfilePath), "utf-8");
      const pkgData = JSON.parse(packageJsonContent);
      lockfile = parseLockfile(lockfileContent, {
        dependencies: pkgData.dependencies,
        devDependencies: pkgData.devDependencies,
      });

      // Enhance parsed with lockfile data
      const directNames = new Set(parsed.dependencies.map(d => d.name));
      const transitiveDeps = lockfile.dependencies
        .filter(d => !directNames.has(d.name))
        .map(d => ({
          name: d.name,
          versionSpecifier: d.version,
          type: d.type,
          depth: d.depth,
          isDirect: false,
          resolvedVersion: d.version,
        }));

      parsed = {
        ...parsed,
        dependencies: [...parsed.dependencies.map(d => {
          const lockDep = lockfile!.dependencies.find(ld => ld.name === d.name);
          return {
            ...d,
            resolvedVersion: lockDep?.version,
            depth: lockDep?.depth ?? 0,
            isDirect: true,
          };
        }), ...transitiveDeps],
        totalCount: parsed.dependencies.length + transitiveDeps.length,
        directCount: parsed.dependencies.length,
        transitiveCount: transitiveDeps.length,
        hasLockfile: true,
      };
    } catch (err) {
      console.error(`Warning: Could not parse lockfile - ${err instanceof Error ? err.message : err}`);
    }
  }

  if (!jsonOutput && !sbomOutput) {
    console.log("\n🔍 DepSec - Analyzing dependencies...\n");
  }

  // Build package list for scanning
  const packages = parsed.dependencies.map(d => ({
    name: d.name,
    version: d.resolvedVersion || resolveVersion(d.versionSpecifier),
  }));

  // Fetch data
  const [vulns, metadata] = await Promise.all([
    fetchVulnerabilities(packages),
    fetchMetadata(parsed.dependencies.map(d => d.name)),
  ]);

  // SBOM output
  if (sbomOutput) {
    const sbom = generateSBOM(parsed, metadata, vulns, lockfile);
    console.log(JSON.stringify(sbom, null, 2));
    process.exit(0);
  }

  // Compute score
  const score = computeSimpleScore(parsed, vulns, metadata);

  // Count vulnerabilities by severity
  const vulnCounts = { total: 0, critical: 0, high: 0, medium: 0, low: 0 };
  for (const depVulns of Object.values(vulns)) {
    for (const v of depVulns) {
      vulnCounts.total++;
      if (v.severity === "CRITICAL") vulnCounts.critical++;
      else if (v.severity === "HIGH") vulnCounts.high++;
      else if (v.severity === "MEDIUM") vulnCounts.medium++;
      else vulnCounts.low++;
    }
  }

  const result: CLIResult = {
    success: score.overall >= threshold,
    score: score.overall,
    grade: score.grade,
    threshold,
    vulnerabilities: vulnCounts,
    dependencies: {
      total: parsed.totalCount,
      direct: parsed.directCount ?? parsed.totalCount,
      transitive: parsed.transitiveCount ?? 0,
    },
    categories: score.categories.map(c => ({
      name: c.label,
      score: c.score,
      weight: c.weight,
    })),
    timestamp: new Date().toISOString(),
    packageName: parsed.name,
  };

  if (jsonOutput) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    // Human-readable output
    console.log(`📦 Package: ${parsed.name || "unnamed"}`);
    console.log(`📊 Dependencies: ${parsed.totalCount} total`);
    if (parsed.transitiveCount) {
      console.log(`   ├─ Direct: ${parsed.directCount}`);
      console.log(`   └─ Transitive: ${parsed.transitiveCount}`);
    }
    console.log("");
    console.log(`🛡️  Security Score: ${score.overall}/100 (${score.grade})`);
    console.log("");
    
    if (vulnCounts.total > 0) {
      console.log("⚠️  Vulnerabilities:");
      if (vulnCounts.critical > 0) console.log(`   🔴 Critical: ${vulnCounts.critical}`);
      if (vulnCounts.high > 0) console.log(`   🟠 High: ${vulnCounts.high}`);
      if (vulnCounts.medium > 0) console.log(`   🟡 Medium: ${vulnCounts.medium}`);
      if (vulnCounts.low > 0) console.log(`   🟢 Low: ${vulnCounts.low}`);
    } else {
      console.log("✅ No vulnerabilities found");
    }
    console.log("");

    if (threshold > 0) {
      if (result.success) {
        console.log(`✅ Score ${score.overall} meets threshold ${threshold}`);
      } else {
        console.log(`❌ Score ${score.overall} is below threshold ${threshold}`);
      }
    }
  }

  // Exit with appropriate code
  process.exit(result.success ? 0 : 1);
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
