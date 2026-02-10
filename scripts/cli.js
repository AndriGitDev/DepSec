#!/usr/bin/env node

/**
 * DepSec CLI - Dependency Security Analyzer
 * 
 * Standalone CLI that doesn't require the full Next.js build.
 * 
 * Usage:
 *   npx depsec --ci package.json [--lock package-lock.json] [--fail-under 70]
 *   npx depsec package.json --json
 *   npx depsec package.json --sbom
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// CLI output result interface
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

function resolveVersion(specifier) {
  // Simple version resolution - strip leading ^~>=< characters
  return specifier.replace(/^[\^~>=<\s]+/, "").split(/\s/)[0] || "0.0.0";
}

function parsePackageJson(raw) {
  let json;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new Error("Invalid JSON: could not parse the file.");
  }

  const { name, version, dependencies, devDependencies } = json;

  if (!dependencies && !devDependencies) {
    throw new Error("No dependencies found.");
  }

  const deps = [];

  if (dependencies) {
    for (const [depName, versionSpecifier] of Object.entries(dependencies)) {
      deps.push({ name: depName, versionSpecifier, type: "prod" });
    }
  }

  if (devDependencies) {
    for (const [depName, versionSpecifier] of Object.entries(devDependencies)) {
      deps.push({ name: depName, versionSpecifier, type: "dev" });
    }
  }

  return {
    name,
    version,
    dependencies: deps,
    totalCount: deps.length,
    prodCount: deps.filter(d => d.type === "prod").length,
    devCount: deps.filter(d => d.type === "dev").length,
  };
}

function parseLockfile(raw, packageJsonDeps) {
  let json;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new Error("Invalid JSON: could not parse the lockfile.");
  }

  const lockfileVersion = json.lockfileVersion || 1;
  const packages = json.packages || {};
  const dependencies = [];
  
  const directDeps = new Set();
  if (packageJsonDeps) {
    if (packageJsonDeps.dependencies) {
      Object.keys(packageJsonDeps.dependencies).forEach(d => directDeps.add(d));
    }
    if (packageJsonDeps.devDependencies) {
      Object.keys(packageJsonDeps.devDependencies).forEach(d => directDeps.add(d));
    }
  }

  // Parse v2/v3 format
  if (lockfileVersion >= 2) {
    for (const [pkgPath, pkg] of Object.entries(packages)) {
      if (pkgPath === "") continue; // Skip root
      
      // Extract package name from path
      const parts = pkgPath.split("/node_modules/");
      let name = parts[parts.length - 1];
      if (name.startsWith("@")) {
        const scopedParts = name.split("/");
        if (scopedParts.length >= 2) {
          name = `${scopedParts[0]}/${scopedParts[1]}`;
        }
      } else {
        name = name.split("/")[0];
      }

      if (!name || !pkg.version) continue;

      const depth = (pkgPath.match(/node_modules/g) || []).length - 1;
      const isDirect = directDeps.has(name) && depth === 0;
      
      dependencies.push({
        name,
        version: pkg.version,
        versionSpecifier: pkg.version,
        type: pkg.dev ? "dev" : "prod",
        depth,
        isDirect,
      });
    }
  }

  // Deduplicate
  const uniqueDeps = new Map();
  for (const dep of dependencies) {
    const existing = uniqueDeps.get(dep.name);
    if (!existing || dep.depth < existing.depth) {
      uniqueDeps.set(dep.name, dep);
    }
  }

  const finalDeps = Array.from(uniqueDeps.values());
  const directCount = finalDeps.filter(d => d.isDirect).length;

  return {
    name: json.name,
    version: json.version,
    lockfileVersion,
    dependencies: finalDeps,
    totalCount: finalDeps.length,
    directCount,
    transitiveCount: finalDeps.length - directCount,
  };
}

async function fetchVulnerabilities(packages) {
  const results = {};
  
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
        const vulns = data.results?.[j]?.vulns || [];
        results[batch[j].name] = vulns.map(v => ({
          id: v.id,
          summary: v.summary,
          severity: classifySeverity(v),
        }));
      }
    } catch (err) {
      // Continue on error
    }
  }

  return results;
}

function classifySeverity(v) {
  const dbSev = (v.database_specific?.severity || "").toUpperCase();
  if (dbSev === "CRITICAL") return "CRITICAL";
  if (dbSev === "HIGH") return "HIGH";
  if (dbSev === "MEDIUM" || dbSev === "MODERATE") return "MEDIUM";
  if (dbSev === "LOW") return "LOW";
  return "MEDIUM";
}

async function fetchMetadata(depNames) {
  const results = {};
  
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

function computeScore(parsed, vulns, metadata) {
  let vulnScore = 100;
  let licenseScore = 100;
  let maintenanceScore = 100;

  const vulnCounts = { critical: 0, high: 0, medium: 0, low: 0 };
  
  for (const dep of parsed.dependencies) {
    const depVulns = vulns[dep.name] || [];
    for (const v of depVulns) {
      if (v.severity === "CRITICAL") vulnCounts.critical++;
      else if (v.severity === "HIGH") vulnCounts.high++;
      else if (v.severity === "MEDIUM") vulnCounts.medium++;
      else vulnCounts.low++;
    }
  }

  vulnScore = Math.max(0, 100 - vulnCounts.critical * 25 - vulnCounts.high * 15 - vulnCounts.medium * 5 - vulnCounts.low * 2);
  if (vulnCounts.critical > 0) vulnScore = Math.min(vulnScore, 30);
  else if (vulnCounts.high > 0) vulnScore = Math.min(vulnScore, 60);

  const badLicenses = Object.values(metadata).filter(m => {
    const lic = (m.license || "").toUpperCase();
    return lic.includes("GPL") || lic.includes("AGPL") || !m.license;
  }).length;
  licenseScore = Math.max(0, 100 - badLicenses * 10);

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
      { name: "Vulnerabilities", score: vulnScore, weight: 0.4 },
      { name: "Licenses", score: licenseScore, weight: 0.3 },
      { name: "Maintenance", score: maintenanceScore, weight: 0.3 },
    ],
  };
}

function generateSBOM(parsed, metadata, vulns) {
  const components = [];
  const vulnerabilities = [];
  const processedVulns = new Set();

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

    const depVulns = vulns[dep.name] || [];
    for (const v of depVulns) {
      if (processedVulns.has(v.id)) continue;
      processedVulns.add(v.id);

      vulnerabilities.push({
        id: v.id,
        source: { name: "OSV", url: `https://osv.dev/vulnerability/${v.id}` },
        ratings: v.severity ? [{ severity: v.severity.toLowerCase() }] : undefined,
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
  let packageJsonPath = null;
  let lockfilePath = null;
  let threshold = 0;
  let ciMode = false;
  let jsonOutput = false;
  let sbomOutput = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--ci") {
      ciMode = true;
      jsonOutput = true;
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
  let packageJsonContent;
  try {
    packageJsonContent = fs.readFileSync(path.resolve(packageJsonPath), "utf-8");
  } catch (err) {
    console.error(`Error: Could not read ${packageJsonPath}`);
    process.exit(1);
  }

  let parsed;
  try {
    parsed = parsePackageJson(packageJsonContent);
  } catch (err) {
    console.error(`Error: Invalid package.json - ${err.message}`);
    process.exit(1);
  }

  // Read lockfile if provided
  if (lockfilePath) {
    try {
      const lockfileContent = fs.readFileSync(path.resolve(lockfilePath), "utf-8");
      const pkgData = JSON.parse(packageJsonContent);
      const lockfile = parseLockfile(lockfileContent, {
        dependencies: pkgData.dependencies,
        devDependencies: pkgData.devDependencies,
      });

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
          const lockDep = lockfile.dependencies.find(ld => ld.name === d.name);
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
      console.error(`Warning: Could not parse lockfile - ${err.message}`);
    }
  }

  if (!jsonOutput && !sbomOutput) {
    console.log("\n🔍 DepSec - Analyzing dependencies...\n");
  }

  const packages = parsed.dependencies.map(d => ({
    name: d.name,
    version: d.resolvedVersion || resolveVersion(d.versionSpecifier),
  }));

  const [vulns, metadata] = await Promise.all([
    fetchVulnerabilities(packages),
    fetchMetadata(parsed.dependencies.map(d => d.name)),
  ]);

  if (sbomOutput) {
    const sbom = generateSBOM(parsed, metadata, vulns);
    console.log(JSON.stringify(sbom, null, 2));
    process.exit(0);
  }

  const score = computeScore(parsed, vulns, metadata);

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

  const result = {
    success: score.overall >= threshold,
    score: score.overall,
    grade: score.grade,
    threshold,
    vulnerabilities: vulnCounts,
    dependencies: {
      total: parsed.totalCount,
      direct: parsed.directCount || parsed.totalCount,
      transitive: parsed.transitiveCount || 0,
    },
    categories: score.categories,
    timestamp: new Date().toISOString(),
    packageName: parsed.name,
  };

  if (jsonOutput) {
    console.log(JSON.stringify(result, null, 2));
  } else {
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

  process.exit(result.success ? 0 : 1);
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
