import type { Vulnerability } from "@/types";

export async function fetchVulnerabilities(
  packages: Array<{ name: string; version: string }>
): Promise<Record<string, Vulnerability[]>> {
  const results: Record<string, Vulnerability[]> = {};
  for (let i = 0; i < packages.length; i += 200) {
    const res = await fetch("/api/vulnerabilities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ packages: packages.slice(i, i + 200) }),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      throw new Error(`Vulnerability check failed: ${res.status}`);
    }
    Object.assign(results, await res.json());
  }
  return results;
}
