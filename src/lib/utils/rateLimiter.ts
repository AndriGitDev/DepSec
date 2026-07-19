const windowMs = 60_000;
const maxRequests = 30;
const maxTrackedClients = 10_000;

const clients = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(ip: string): boolean {
  const now = Date.now();

  if (clients.size >= maxTrackedClients) {
    for (const [key, value] of clients) {
      if (now > value.resetAt) clients.delete(key);
    }
    if (clients.size >= maxTrackedClients && !clients.has(ip)) return false;
  }
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
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.slice(0, 64);
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim().slice(0, 64);
  return "unknown";
}
