/** Rate limiting simples em memória (por IP + rota). */
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, limit = 30, windowMs = 60_000): void {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  bucket.count += 1;
  if (bucket.count > limit) {
    throw Object.assign(new Error("Muitas requisições. Aguarde alguns instantes."), { status: 429 });
  }
  if (buckets.size > 5000) buckets.clear();
}

export function clientKey(request: Request, scope: string): string {
  const forwarded = request.headers.get("x-forwarded-for") || "";
  const ip = forwarded.split(",")[0].trim() || request.headers.get("x-real-ip") || "local";
  return `${scope}:${ip}`;
}

export function isRateLimitError(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && (error as { status?: number }).status === 429);
}
