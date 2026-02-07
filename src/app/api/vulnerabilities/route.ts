import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, getClientIp } from "@/lib/utils/rateLimiter";

const requestSchema = z.object({
  packages: z.array(
    z.object({
      name: z.string(),
      version: z.string(),
    })
  ),
});

interface OsvVuln {
  id: string;
  summary?: string;
  severity?: Array<{ type: string; score: string }>;
  aliases?: string[];
  database_specific?: { severity?: string };
}

// Compute CVSS v3 base score from a vector string like "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H"
function cvssV3BaseScore(vector: string): number | null {
  const metrics: Record<string, string> = {};
  for (const part of vector.split("/")) {
    const [key, val] = part.split(":");
    if (key && val) metrics[key] = val;
  }

  const av: Record<string, number> = { N: 0.85, A: 0.62, L: 0.55, P: 0.20 };
  const ac: Record<string, number> = { L: 0.77, H: 0.44 };
  const ui: Record<string, number> = { N: 0.85, R: 0.62 };
  const cia: Record<string, number> = { N: 0, L: 0.22, H: 0.56 };

  const AV = av[metrics.AV ?? ""];
  const AC = ac[metrics.AC ?? ""];
  const UI = ui[metrics.UI ?? ""];
  const C = cia[metrics.C ?? ""];
  const I = cia[metrics.I ?? ""];
  const A = cia[metrics.A ?? ""];
  const scopeChanged = metrics.S === "C";

  if ([AV, AC, UI, C, I, A].some((v) => v === undefined)) return null;

  // Privileges Required depends on Scope
  const prVals: Record<string, Record<string, number>> = {
    U: { N: 0.85, L: 0.62, H: 0.27 },
    C: { N: 0.85, L: 0.68, H: 0.50 },
  };
  const PR = prVals[scopeChanged ? "C" : "U"]?.[metrics.PR ?? ""];
  if (PR === undefined) return null;

  const iss = 1 - (1 - C) * (1 - I) * (1 - A);
  const impact = scopeChanged
    ? 7.52 * (iss - 0.029) - 3.25 * Math.pow(iss - 0.02, 15)
    : 6.42 * iss;

  if (impact <= 0) return 0;

  const exploitability = 8.22 * AV * AC * PR * UI;
  const raw = scopeChanged
    ? 1.08 * (impact + exploitability)
    : impact + exploitability;

  return Math.min(Math.ceil(raw * 10) / 10, 10);
}

interface OsvBatchResult {
  results: Array<{ vulns?: Array<{ id: string; modified: string }> }>;
}

// Fetch full vuln details from OSV (with concurrency limit)
async function fetchVulnDetails(
  ids: string[],
  concurrency: number
): Promise<Map<string, OsvVuln>> {
  const results = new Map<string, OsvVuln>();
  let index = 0;

  async function worker() {
    while (index < ids.length) {
      const i = index++;
      const id = ids[i];
      try {
        const res = await fetch(`https://api.osv.dev/v1/vulns/${encodeURIComponent(id)}`, {
          headers: { Accept: "application/json" },
          signal: AbortSignal.timeout(8000),
        });
        if (res.ok) {
          const data: OsvVuln = await res.json();
          results.set(id, data);
        }
      } catch {
        // skip failed fetches
      }
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, ids.length) },
    () => worker()
  );
  await Promise.all(workers);
  return results;
}

function classifySeverity(v: OsvVuln): { severity?: string; cvssScore?: number } {
  let severity: string | undefined;
  let cvssScore: number | undefined;

  // 1. Try parsing the CVSS v3 vector string
  if (v.severity && v.severity.length > 0) {
    const cvss = v.severity.find((s) => s.type === "CVSS_V3" || s.type === "CVSS_V4");
    if (cvss) {
      cvssScore = cvssV3BaseScore(cvss.score) ?? undefined;
    }
  }

  // 2. Determine severity from computed CVSS score
  if (cvssScore !== undefined) {
    if (cvssScore >= 9.0) severity = "CRITICAL";
    else if (cvssScore >= 7.0) severity = "HIGH";
    else if (cvssScore >= 4.0) severity = "MEDIUM";
    else severity = "LOW";
  }

  // 3. Fallback: check database_specific.severity (common in GHSA entries)
  if (!severity && v.database_specific?.severity) {
    const dbSev = v.database_specific.severity.toUpperCase();
    if (["CRITICAL", "HIGH", "MEDIUM", "MODERATE", "LOW"].includes(dbSev)) {
      severity = dbSev === "MODERATE" ? "MEDIUM" : dbSev;
    }
  }

  // 4. Last resort: infer from summary text
  if (!severity && v.summary) {
    const lower = v.summary.toLowerCase();
    if (lower.includes("critical")) severity = "CRITICAL";
    else if (lower.includes("high")) severity = "HIGH";
    else if (lower.includes("medium") || lower.includes("moderate"))
      severity = "MEDIUM";
    else severity = "MEDIUM"; // default unknown vulns to MEDIUM, not LOW
  }

  return { severity, cvssScore };
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { packages } = parsed.data;

  try {
    // Step 1: Batch query to find which packages have vulns (returns only IDs)
    const batchSize = 100;
    const batches: typeof packages[] = [];
    for (let i = 0; i < packages.length; i += batchSize) {
      batches.push(packages.slice(i, i + batchSize));
    }

    // Map: package name → list of vuln IDs
    const pkgVulnIds: Record<string, string[]> = {};
    const allVulnIds = new Set<string>();

    for (const batch of batches) {
      const queries = batch.map((pkg) => ({
        package: { name: pkg.name, ecosystem: "npm" },
        version: pkg.version,
      }));

      const res = await fetch("https://api.osv.dev/v1/querybatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ queries }),
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) continue;

      const data: OsvBatchResult = await res.json();

      for (let i = 0; i < batch.length; i++) {
        const vulns = data.results[i]?.vulns ?? [];
        const ids = vulns.map((v) => v.id);
        pkgVulnIds[batch[i].name] = ids;
        for (const id of ids) allVulnIds.add(id);
      }
    }

    // Step 2: Fetch full details for all unique vuln IDs (concurrency-limited)
    const vulnDetails = await fetchVulnDetails([...allVulnIds], 15);

    // Step 3: Build results with proper severity classification
    const allResults: Record<
      string,
      Array<{
        id: string;
        summary?: string;
        severity?: string;
        cvssScore?: number;
        aliases?: string[];
      }>
    > = {};

    for (const pkg of packages) {
      const ids = pkgVulnIds[pkg.name] ?? [];
      if (ids.length === 0) {
        allResults[pkg.name] = [];
        continue;
      }

      allResults[pkg.name] = ids.map((id) => {
        const detail = vulnDetails.get(id);
        if (!detail) {
          return { id, severity: "MEDIUM" }; // couldn't fetch details, assume MEDIUM
        }

        const { severity, cvssScore } = classifySeverity(detail);
        return {
          id: detail.id,
          summary: detail.summary,
          severity,
          cvssScore,
          aliases: detail.aliases,
        };
      });
    }

    return NextResponse.json(allResults);
  } catch (err) {
    console.error("OSV API error:", err);
    return NextResponse.json(
      { error: "Failed to fetch vulnerability data" },
      { status: 502 }
    );
  }
}
