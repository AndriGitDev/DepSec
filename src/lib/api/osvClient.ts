import type { Vulnerability } from "@/types";

export async function fetchVulnerabilities(
  packages: Array<{ name: string; version: string }>
): Promise<Record<string, Vulnerability[]>> {
  const res = await fetch("/api/vulnerabilities", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ packages }),
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    throw new Error(`Vulnerability check failed: ${res.status}`);
  }

  return res.json();
}
