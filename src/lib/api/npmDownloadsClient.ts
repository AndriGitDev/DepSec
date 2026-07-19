export async function fetchDownloadCounts(
  packages: string[]
): Promise<Record<string, number>> {
  const results: Record<string, number> = {};
  for (let i = 0; i < packages.length; i += 200) {
    const res = await fetch("/api/download-counts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ packages: packages.slice(i, i + 200) }),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      throw new Error(`Download counts fetch failed: ${res.status}`);
    }
    Object.assign(results, await res.json());
  }
  return results;
}
