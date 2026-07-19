import type { PackageMetadata } from "@/types";

export async function fetchPackageMetadata(
  packages: string[]
): Promise<Record<string, PackageMetadata>> {
  const results: Record<string, PackageMetadata> = {};
  for (let i = 0; i < packages.length; i += 200) {
    const res = await fetch("/api/package-metadata", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ packages: packages.slice(i, i + 200) }),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      throw new Error(`Package metadata fetch failed: ${res.status}`);
    }
    Object.assign(results, await res.json());
  }
  return results;
}
