export async function fetchDownloadCounts(
  packages: string[]
): Promise<Record<string, number>> {
  const res = await fetch("/api/download-counts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ packages }),
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    throw new Error(`Download counts fetch failed: ${res.status}`);
  }

  return res.json();
}
