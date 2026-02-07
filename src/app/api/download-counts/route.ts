import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, getClientIp } from "@/lib/utils/rateLimiter";

const requestSchema = z.object({
  packages: z.array(z.string()),
});

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
    const results: Record<string, number> = {};

    // Split scoped and unscoped
    const scoped = packages.filter((p) => p.startsWith("@"));
    const unscoped = packages.filter((p) => !p.startsWith("@"));

    // Bulk fetch unscoped (max 128 per request)
    const batchSize = 128;
    for (let i = 0; i < unscoped.length; i += batchSize) {
      const batch = unscoped.slice(i, i + batchSize);
      const joined = batch.join(",");

      try {
        const res = await fetch(
          `https://api.npmjs.org/downloads/point/last-month/${joined}`,
          { signal: AbortSignal.timeout(10000) }
        );

        if (res.ok) {
          const data = await res.json();
          for (const name of batch) {
            results[name] = data[name]?.downloads ?? 0;
          }
        } else {
          for (const name of batch) results[name] = 0;
        }
      } catch {
        for (const name of batch) results[name] = 0;
      }
    }

    // Fetch scoped packages individually
    await Promise.all(
      scoped.map(async (name) => {
        try {
          const encoded = encodeURIComponent(name);
          const res = await fetch(
            `https://api.npmjs.org/downloads/point/last-month/${encoded}`,
            { signal: AbortSignal.timeout(10000) }
          );

          if (res.ok) {
            const data = await res.json();
            results[name] = data.downloads ?? 0;
          } else {
            results[name] = 0;
          }
        } catch {
          results[name] = 0;
        }
      })
    );

    return NextResponse.json(results);
  } catch (err) {
    console.error("npm downloads error:", err);
    return NextResponse.json(
      { error: "Failed to fetch download counts" },
      { status: 502 }
    );
  }
}
