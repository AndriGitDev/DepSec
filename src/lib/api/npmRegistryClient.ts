import type { PackageMetadata } from "@/types";

export async function fetchPackageMetadata(
  packages: string[]
): Promise<Record<string, PackageMetadata>> {
  const res = await fetch("/api/package-metadata", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ packages }),
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    throw new Error(`Package metadata fetch failed: ${res.status}`);
  }

  return res.json();
}
