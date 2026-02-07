export interface Dependency {
  name: string;
  versionSpecifier: string;
  type: "prod" | "dev";
}

export interface ParsedPackageJson {
  name?: string;
  version?: string;
  dependencies: Dependency[];
  totalCount: number;
  prodCount: number;
  devCount: number;
}
