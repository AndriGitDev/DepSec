import { z } from "zod";
import type { Dependency } from "./types";

/**
 * Represents a resolved dependency from package-lock.json
 */
export interface ResolvedDependency {
  name: string;
  version: string;           // Resolved exact version
  versionSpecifier: string;  // Original specifier from package.json (if direct)
  type: "prod" | "dev";
  depth: number;             // 0 = direct, 1+ = transitive
  isDirect: boolean;
  resolvedFrom?: string;     // Parent package that requires this (for transitive)
  integrity?: string;        // Package integrity hash
  dependencies?: string[];   // Names of packages this depends on
}

export interface ParsedLockfile {
  name?: string;
  version?: string;
  lockfileVersion: number;
  dependencies: ResolvedDependency[];
  dependencyTree: Map<string, string[]>; // package name -> child dependencies
  totalCount: number;
  directCount: number;
  transitiveCount: number;
  prodCount: number;
  devCount: number;
  maxDepth: number;
}

// Schema for package-lock.json v2/v3
const lockfilePackageSchema = z.object({
  version: z.string().optional(),
  resolved: z.string().optional(),
  integrity: z.string().optional(),
  dev: z.boolean().optional(),
  dependencies: z.record(z.string()).optional(),
  requires: z.record(z.string()).optional(),
  optional: z.boolean().optional(),
  peer: z.boolean().optional(),
});

const lockfileSchemaV2V3 = z.object({
  name: z.string().optional(),
  version: z.string().optional(),
  lockfileVersion: z.number(),
  packages: z.record(lockfilePackageSchema).optional(),
});

// Schema for package-lock.json v1 (legacy)
const lockfileSchemaV1 = z.object({
  name: z.string().optional(),
  version: z.string().optional(),
  lockfileVersion: z.number().optional(),
  dependencies: z.record(z.object({
    version: z.string(),
    resolved: z.string().optional(),
    integrity: z.string().optional(),
    dev: z.boolean().optional(),
    requires: z.record(z.string()).optional(),
    dependencies: z.record(z.unknown()).optional(),
  })).optional(),
});

/**
 * Extract package name from node_modules path
 * e.g., "node_modules/@babel/core" -> "@babel/core"
 *       "node_modules/lodash" -> "lodash"
 *       "node_modules/@scope/pkg/node_modules/nested" -> "nested"
 */
function extractPackageName(path: string): string | null {
  if (!path || path === "") return null;
  
  // Split by /node_modules/ and take the last segment
  const parts = path.split("/node_modules/");
  const lastPart = parts[parts.length - 1];
  
  if (!lastPart) return null;
  
  // Handle scoped packages
  if (lastPart.startsWith("@")) {
    const scopedParts = lastPart.split("/");
    if (scopedParts.length >= 2) {
      return `${scopedParts[0]}/${scopedParts[1]}`;
    }
  }
  
  // Regular package - take first part (in case of nested paths)
  return lastPart.split("/")[0];
}

/**
 * Calculate depth of a package based on its path
 * e.g., "node_modules/lodash" -> 1 (direct)
 *       "node_modules/pkg/node_modules/nested" -> 2 (transitive)
 */
function calculateDepth(path: string): number {
  if (!path || path === "") return 0;
  const matches = path.match(/node_modules/g);
  return matches ? matches.length : 0;
}

/**
 * Parse package-lock.json v2/v3 format
 */
function parseV2V3(
  data: z.infer<typeof lockfileSchemaV2V3>,
  directDeps: Set<string>
): ParsedLockfile {
  const packages = data.packages ?? {};
  const dependencies: ResolvedDependency[] = [];
  const dependencyTree = new Map<string, string[]>();
  let maxDepth = 0;
  let prodCount = 0;
  let devCount = 0;

  // First pass: collect all packages
  for (const [path, pkg] of Object.entries(packages)) {
    // Skip the root package (empty path)
    if (path === "") continue;

    const name = extractPackageName(path);
    if (!name || !pkg.version) continue;

    const depth = calculateDepth(path);
    maxDepth = Math.max(maxDepth, depth);
    
    const isDirect = directDeps.has(name) && depth === 1;
    const isDev = pkg.dev === true;
    
    if (isDev) {
      devCount++;
    } else {
      prodCount++;
    }

    // Build dependency relationships from requires/dependencies
    const childDeps: string[] = [];
    if (pkg.dependencies) {
      childDeps.push(...Object.keys(pkg.dependencies));
    }
    if (pkg.requires) {
      childDeps.push(...Object.keys(pkg.requires));
    }
    
    if (childDeps.length > 0) {
      dependencyTree.set(name, [...new Set(childDeps)]);
    }

    dependencies.push({
      name,
      version: pkg.version,
      versionSpecifier: isDirect ? `^${pkg.version}` : pkg.version,
      type: isDev ? "dev" : "prod",
      depth: depth - 1, // Convert to 0-based (0 = direct)
      isDirect,
      integrity: pkg.integrity,
      dependencies: childDeps.length > 0 ? childDeps : undefined,
    });
  }

  // Deduplicate by name (keep the one with lowest depth)
  const uniqueDeps = new Map<string, ResolvedDependency>();
  for (const dep of dependencies) {
    const existing = uniqueDeps.get(dep.name);
    if (!existing || dep.depth < existing.depth) {
      uniqueDeps.set(dep.name, dep);
    }
  }

  const finalDeps = Array.from(uniqueDeps.values());
  const directCount = finalDeps.filter(d => d.isDirect).length;
  const transitiveCount = finalDeps.length - directCount;

  return {
    name: data.name,
    version: data.version,
    lockfileVersion: data.lockfileVersion,
    dependencies: finalDeps,
    dependencyTree,
    totalCount: finalDeps.length,
    directCount,
    transitiveCount,
    prodCount,
    devCount,
    maxDepth: maxDepth - 1,
  };
}

/**
 * Parse package-lock.json v1 format (legacy)
 */
function parseV1(
  data: z.infer<typeof lockfileSchemaV1>,
  directDeps: Set<string>
): ParsedLockfile {
  const dependencies: ResolvedDependency[] = [];
  const dependencyTree = new Map<string, string[]>();
  let maxDepth = 0;
  let prodCount = 0;
  let devCount = 0;

  function processDeps(
    deps: Record<string, { version: string; dev?: boolean; requires?: Record<string, string>; dependencies?: Record<string, unknown> }>,
    depth: number,
    parentName?: string
  ) {
    for (const [name, pkg] of Object.entries(deps)) {
      maxDepth = Math.max(maxDepth, depth);
      
      const isDirect = directDeps.has(name) && depth === 0;
      const isDev = pkg.dev === true;
      
      if (isDev) {
        devCount++;
      } else {
        prodCount++;
      }

      const childDeps = pkg.requires ? Object.keys(pkg.requires) : [];
      if (childDeps.length > 0) {
        dependencyTree.set(name, childDeps);
      }

      dependencies.push({
        name,
        version: pkg.version,
        versionSpecifier: isDirect ? `^${pkg.version}` : pkg.version,
        type: isDev ? "dev" : "prod",
        depth,
        isDirect,
        resolvedFrom: parentName,
        dependencies: childDeps.length > 0 ? childDeps : undefined,
      });

      // Process nested dependencies
      if (pkg.dependencies) {
        processDeps(
          pkg.dependencies as Record<string, { version: string; dev?: boolean; requires?: Record<string, string>; dependencies?: Record<string, unknown> }>,
          depth + 1,
          name
        );
      }
    }
  }

  if (data.dependencies) {
    processDeps(data.dependencies, 0);
  }

  // Deduplicate by name (keep the one with lowest depth)
  const uniqueDeps = new Map<string, ResolvedDependency>();
  for (const dep of dependencies) {
    const existing = uniqueDeps.get(dep.name);
    if (!existing || dep.depth < existing.depth) {
      uniqueDeps.set(dep.name, dep);
    }
  }

  const finalDeps = Array.from(uniqueDeps.values());
  const directCount = finalDeps.filter(d => d.isDirect).length;
  const transitiveCount = finalDeps.length - directCount;

  return {
    name: data.name,
    version: data.version,
    lockfileVersion: data.lockfileVersion ?? 1,
    dependencies: finalDeps,
    dependencyTree,
    totalCount: finalDeps.length,
    directCount,
    transitiveCount,
    prodCount,
    devCount,
    maxDepth,
  };
}

/**
 * Parse a package-lock.json file
 * Supports lockfileVersion 1, 2, and 3
 */
export function parseLockfile(
  raw: string,
  packageJsonDeps?: { dependencies?: Record<string, string>; devDependencies?: Record<string, string> }
): ParsedLockfile {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new Error("Invalid JSON: could not parse the lockfile.");
  }

  // Determine lockfile version
  const versionCheck = z.object({ lockfileVersion: z.number().optional() }).safeParse(json);
  const lockfileVersion = versionCheck.success ? (versionCheck.data.lockfileVersion ?? 1) : 1;

  // Build set of direct dependencies from package.json if provided
  const directDeps = new Set<string>();
  if (packageJsonDeps) {
    if (packageJsonDeps.dependencies) {
      Object.keys(packageJsonDeps.dependencies).forEach(d => directDeps.add(d));
    }
    if (packageJsonDeps.devDependencies) {
      Object.keys(packageJsonDeps.devDependencies).forEach(d => directDeps.add(d));
    }
  }

  if (lockfileVersion >= 2) {
    const result = lockfileSchemaV2V3.safeParse(json);
    if (!result.success) {
      throw new Error("Invalid package-lock.json: unexpected structure for v2/v3 format.");
    }
    return parseV2V3(result.data, directDeps);
  } else {
    const result = lockfileSchemaV1.safeParse(json);
    if (!result.success) {
      throw new Error("Invalid package-lock.json: unexpected structure for v1 format.");
    }
    return parseV1(result.data, directDeps);
  }
}

/**
 * Convert ParsedLockfile to the legacy Dependency format for backward compatibility
 */
export function toLegacyDependencies(lockfile: ParsedLockfile): Dependency[] {
  return lockfile.dependencies.map(dep => ({
    name: dep.name,
    versionSpecifier: dep.versionSpecifier,
    type: dep.type,
  }));
}

/**
 * Get dependency weight based on depth for scoring
 * Direct dependencies are weighted more heavily than transitive
 */
export function getDepthWeight(depth: number): number {
  if (depth === 0) return 1.0;      // Direct dependency
  if (depth === 1) return 0.7;      // First-level transitive
  return 0.4;                        // Deeper transitive
}
