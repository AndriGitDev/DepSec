export interface Dependency {
  name: string;
  versionSpecifier: string;
  type: "prod" | "dev";
  depth?: number;           // 0 = direct, 1+ = transitive
  isDirect?: boolean;       // true for direct dependencies
  resolvedVersion?: string; // Resolved version from lockfile
  dependencies?: string[];  // Child dependency names
}

export interface ParsedPackageJson {
  name?: string;
  version?: string;
  dependencies: Dependency[];
  totalCount: number;
  prodCount: number;
  devCount: number;
  // Enhanced fields for lockfile support
  directCount?: number;
  transitiveCount?: number;
  maxDepth?: number;
  hasLockfile?: boolean;
  dependencyTree?: Map<string, string[]>;
}
