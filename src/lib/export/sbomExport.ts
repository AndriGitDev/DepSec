/**
 * SBOM Export - CycloneDX 1.5 Format
 * Generates Software Bill of Materials in CycloneDX JSON format
 */

import type { ParsedPackageJson, Vulnerability, PackageMetadata } from "@/types";
import * as semver from "semver";

interface CycloneDXLicense {
  license: {
    id?: string;
    name?: string;
  };
}

interface CycloneDXComponent {
  type: string;
  "bom-ref": string;
  name: string;
  version: string;
  purl: string;
  licenses?: CycloneDXLicense[];
  description?: string;
  properties?: Array<{ name: string; value: string }>;
}

interface CycloneDXDependency {
  ref: string;
  dependsOn?: string[];
}

interface CycloneDXVulnerability {
  "bom-ref": string;
  id: string;
  source?: {
    name: string;
    url?: string;
  };
  ratings?: Array<{
    severity: string;
    score?: number;
    method?: string;
  }>;
  description?: string;
  recommendation?: string;
  affects?: Array<{
    ref: string;
    versions?: Array<{
      version: string;
      status: string;
    }>;
  }>;
}

interface CycloneDXSBOM {
  $schema: string;
  bomFormat: string;
  specVersion: string;
  serialNumber: string;
  version: number;
  metadata: {
    timestamp: string;
    tools?: {
      components: Array<{
        type: string;
        name: string;
        version: string;
        manufacturer?: { name: string };
      }>;
    };
    component?: {
      type: string;
      name: string;
      version?: string;
      "bom-ref"?: string;
    };
  };
  components: CycloneDXComponent[];
  dependencies?: CycloneDXDependency[];
  vulnerabilities?: CycloneDXVulnerability[];
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

function generatePurl(name: string, version: string): string {
  // Package URL format for npm packages
  // https://github.com/package-url/purl-spec
  const encodedName = name.startsWith("@")
    ? name.replace("/", "%2F")
    : name;
  return `pkg:npm/${encodedName}@${version}`;
}

function generateUUID(): string {
  // Simple UUID v4 generator for browser/node compatibility
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function mapSeverity(severity?: string): string {
  switch (severity?.toUpperCase()) {
    case "CRITICAL":
      return "critical";
    case "HIGH":
      return "high";
    case "MEDIUM":
      return "medium";
    case "LOW":
      return "low";
    default:
      return "unknown";
  }
}

export function generateCycloneDXSBOM(
  parsed: ParsedPackageJson,
  vulnerabilities: Record<string, Vulnerability[]>,
  metadata: Record<string, PackageMetadata>
): CycloneDXSBOM {
  const components: CycloneDXComponent[] = [];
  const dependencies: CycloneDXDependency[] = [];
  const vulnEntries: CycloneDXVulnerability[] = [];
  const processedVulns = new Set<string>();

  // Root component
  const rootRef = parsed.name
    ? generatePurl(parsed.name, parsed.version || "0.0.0")
    : "pkg:npm/root@0.0.0";

  // Build dependency list for root
  const rootDependsOn: string[] = [];

  for (const dep of parsed.dependencies) {
    const version = dep.resolvedVersion || resolveVersion(dep.versionSpecifier);
    const purl = generatePurl(dep.name, version);
    const bomRef = purl;
    const depMeta = metadata[dep.name];

    // Add component
    const component: CycloneDXComponent = {
      type: "library",
      "bom-ref": bomRef,
      name: dep.name,
      version,
      purl,
    };

    // Add license if available
    if (depMeta?.license) {
      component.licenses = [
        {
          license: {
            id: depMeta.license,
          },
        },
      ];
    }

    // Add description if available
    if (depMeta?.description) {
      component.description = depMeta.description;
    }

    // Add properties for depth/type
    const properties: Array<{ name: string; value: string }> = [];
    if (dep.type) {
      properties.push({ name: "npm:dependency-type", value: dep.type });
    }
    if (dep.depth !== undefined) {
      properties.push({ name: "depsec:depth", value: String(dep.depth) });
    }
    if (dep.isDirect !== undefined) {
      properties.push({ name: "depsec:is-direct", value: String(dep.isDirect) });
    }
    if (properties.length > 0) {
      component.properties = properties;
    }

    components.push(component);

    // Track root dependencies (direct only)
    if (dep.isDirect !== false) {
      rootDependsOn.push(bomRef);
    }

    // Build dependency relationships
    if (dep.dependencies && dep.dependencies.length > 0) {
      const childRefs = dep.dependencies
        .map((childName) => {
          const childDep = parsed.dependencies.find((d) => d.name === childName);
          if (!childDep) return null;
          const childVersion = childDep.resolvedVersion || resolveVersion(childDep.versionSpecifier);
          return generatePurl(childName, childVersion);
        })
        .filter((ref): ref is string => ref !== null);

      if (childRefs.length > 0) {
        dependencies.push({
          ref: bomRef,
          dependsOn: childRefs,
        });
      }
    }

    // Process vulnerabilities for this dependency
    const depVulns = vulnerabilities[dep.name] ?? [];
    for (const vuln of depVulns) {
      if (processedVulns.has(vuln.id)) {
        // Add this component to existing vulnerability's affects
        const existing = vulnEntries.find((v) => v.id === vuln.id);
        if (existing && existing.affects) {
          existing.affects.push({
            ref: bomRef,
            versions: [{ version, status: "affected" }],
          });
        }
        continue;
      }
      processedVulns.add(vuln.id);

      const vulnEntry: CycloneDXVulnerability = {
        "bom-ref": `vuln-${vuln.id}`,
        id: vuln.id,
        source: {
          name: "OSV",
          url: `https://osv.dev/vulnerability/${vuln.id}`,
        },
        description: vuln.summary,
        affects: [
          {
            ref: bomRef,
            versions: [{ version, status: "affected" }],
          },
        ],
      };

      // Add ratings
      if (vuln.severity) {
        vulnEntry.ratings = [
          {
            severity: mapSeverity(vuln.severity),
            score: vuln.cvssScore,
            method: vuln.cvssScore ? "CVSSv3" : undefined,
          },
        ];
      }

      // Add remediation recommendation
      if (vuln.fixedVersion) {
        vulnEntry.recommendation = `Upgrade ${dep.name} to version ${vuln.fixedVersion} or later.`;
      } else if (vuln.remediation?.recommendation) {
        vulnEntry.recommendation = vuln.remediation.recommendation;
      }

      vulnEntries.push(vulnEntry);
    }
  }

  // Add root dependency entry
  if (parsed.name && rootDependsOn.length > 0) {
    dependencies.unshift({
      ref: rootRef,
      dependsOn: rootDependsOn,
    });
  }

  const sbom: CycloneDXSBOM = {
    $schema: "http://cyclonedx.org/schema/bom-1.5.schema.json",
    bomFormat: "CycloneDX",
    specVersion: "1.5",
    serialNumber: `urn:uuid:${generateUUID()}`,
    version: 1,
    metadata: {
      timestamp: new Date().toISOString(),
      tools: {
        components: [
          {
            type: "application",
            name: "DepSec",
            version: "0.1.0",
            manufacturer: { name: "DepSec" },
          },
        ],
      },
    },
    components,
  };

  // Add root component metadata if we have a package name
  if (parsed.name) {
    sbom.metadata.component = {
      type: "application",
      name: parsed.name,
      version: parsed.version,
      "bom-ref": rootRef,
    };
  }

  // Add dependencies if we have them
  if (dependencies.length > 0) {
    sbom.dependencies = dependencies;
  }

  // Add vulnerabilities if we have them
  if (vulnEntries.length > 0) {
    sbom.vulnerabilities = vulnEntries;
  }

  return sbom;
}

export function downloadSBOM(sbom: CycloneDXSBOM, filename?: string): void {
  const json = JSON.stringify(sbom, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || `sbom-${sbom.metadata.component?.name || "analysis"}.cdx.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
