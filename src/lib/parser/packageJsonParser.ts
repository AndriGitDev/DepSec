import { z } from "zod";
import type { Dependency, ParsedPackageJson } from "./types";

const packageJsonSchema = z.object({
  name: z.string().optional(),
  version: z.string().optional(),
  dependencies: z.record(z.string()).optional(),
  devDependencies: z.record(z.string()).optional(),
});

export function parsePackageJson(raw: string): ParsedPackageJson {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new Error("Invalid JSON: could not parse the file.");
  }

  const result = packageJsonSchema.safeParse(json);
  if (!result.success) {
    throw new Error("Invalid package.json: unexpected structure.");
  }

  const { name, version, dependencies, devDependencies } = result.data;

  if (!dependencies && !devDependencies) {
    throw new Error(
      "No dependencies found. The file must have a dependencies or devDependencies field."
    );
  }

  const deps: Dependency[] = [];

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

  const prodCount = deps.filter((d) => d.type === "prod").length;
  const devCount = deps.filter((d) => d.type === "dev").length;

  return {
    name,
    version,
    dependencies: deps,
    totalCount: deps.length,
    prodCount,
    devCount,
  };
}
