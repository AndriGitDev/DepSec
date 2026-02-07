import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, getClientIp } from "@/lib/utils/rateLimiter";

const requestSchema = z.object({
  packages: z.array(z.string()),
});

interface NpmPackument {
  license?: string | { type?: string };
  time?: Record<string, string>;
  maintainers?: Array<{ name: string }>;
  description?: string;
  "dist-tags"?: Record<string, string>;
  versions?: Record<string, { dependencies?: Record<string, string> }>;
}

const cache = new Map<string, { data: NpmPackument; expiry: number }>();
const CACHE_TTL = 5 * 60 * 1000;

async function fetchPackageMetadata(name: string): Promise<NpmPackument | null> {
  const cached = cache.get(name);
  if (cached && Date.now() < cached.expiry) {
    return cached.data;
  }

  const encodedName = name.startsWith("@")
    ? `@${encodeURIComponent(name.slice(1))}`
    : encodeURIComponent(name);

  try {
    const res = await fetch(`https://registry.npmjs.org/${encodedName}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return null;

    const data: NpmPackument = await res.json();
    cache.set(name, { data, expiry: Date.now() + CACHE_TTL });
    return data;
  } catch {
    return null;
  }
}

// Concurrency-limited parallel fetcher
async function fetchAllWithConcurrency(
  packages: string[],
  concurrency: number
) {
  const results: Record<
    string,
    {
      name: string;
      license: string | null;
      lastPublished: string | null;
      maintainerCount: number;
      description?: string;
      directDeps?: string[];
    }
  > = {};

  let index = 0;

  async function worker() {
    while (index < packages.length) {
      const i = index++;
      const name = packages[i];
      const data = await fetchPackageMetadata(name);

      let license: string | null = null;
      if (data?.license) {
        license =
          typeof data.license === "string"
            ? data.license
            : data.license.type ?? null;
      }

      // Extract dependency names from the latest version
      let directDeps: string[] | undefined;
      const latestVersion = data?.["dist-tags"]?.latest;
      if (latestVersion && data?.versions?.[latestVersion]?.dependencies) {
        directDeps = Object.keys(data.versions[latestVersion].dependencies);
      }

      results[name] = {
        name,
        license,
        lastPublished: data?.time?.modified ?? null,
        maintainerCount: data?.maintainers?.length ?? 0,
        description: data?.description,
        directDeps,
      };
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, packages.length) }, () =>
    worker()
  );
  await Promise.all(workers);

  return results;
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

  try {
    const results = await fetchAllWithConcurrency(parsed.data.packages, 10);
    return NextResponse.json(results);
  } catch (err) {
    console.error("npm registry error:", err);
    return NextResponse.json(
      { error: "Failed to fetch package metadata" },
      { status: 502 }
    );
  }
}
