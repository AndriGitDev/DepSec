const windowMs = 60_000;
const maxRequests = 30;

const clients = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const client = clients.get(ip);

  if (!client || now > client.resetAt) {
    clients.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (client.count >= maxRequests) {
    return false;
  }

  client.count++;
  return true;
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}
