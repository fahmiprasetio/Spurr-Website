import { NextRequest, NextResponse } from "next/server";

type RateLimitRule = {
  limit: number;
  windowMs: number;
};

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

const rules = {
  auth: { limit: 8, windowMs: 60_000 },
  mutation: { limit: 30, windowMs: 60_000 },
  read: { limit: 120, windowMs: 60_000 },
  webhook: { limit: 120, windowMs: 60_000 },
} satisfies Record<string, RateLimitRule>;

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  return forwardedFor || realIp || "unknown";
}

function cleanupExpiredBuckets(now: number) {
  if (buckets.size < 500) {
    return;
  }

  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

export function checkRateLimit(
  request: NextRequest,
  scope: keyof typeof rules,
  identifier?: string
): NextResponse | null {
  const rule = rules[scope];
  const now = Date.now();
  cleanupExpiredBuckets(now);

  const key = `${scope}:${identifier || getClientIp(request)}`;
  const existing = buckets.get(key);
  const bucket = existing && existing.resetAt > now ? existing : { count: 0, resetAt: now + rule.windowMs };

  bucket.count += 1;
  buckets.set(key, bucket);

  if (bucket.count <= rule.limit) {
    return null;
  }

  const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));

  return NextResponse.json(
    { error: "Too many requests. Please try again shortly." },
    {
      status: 429,
      headers: {
        "Retry-After": retryAfterSeconds.toString(),
        "X-RateLimit-Limit": rule.limit.toString(),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": new Date(bucket.resetAt).toISOString(),
      },
    }
  );
}
