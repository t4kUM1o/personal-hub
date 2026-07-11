import "server-only";

interface Bucket {
  count: number;
  resetAt: number;
}

// このアプリは docker-compose 上で app コンテナを1つだけ動かす前提(レプリカなし)なので、
// プロセス内メモリでカウントするだけの単純な実装で十分。
// 将来レプリカ数を増やす場合は、DBやRedisなど共有ストアに置き換える必要がある。
const buckets = new Map<string, Bucket>();

function cleanup(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) {
      buckets.delete(key);
    }
  }
}

interface RateLimitOptions {
  maxAttempts: number;
  windowMs: number;
}

interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds?: number;
}

export function checkRateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  cleanup(now);

  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + options.windowMs });
    return { allowed: true };
  }

  if (bucket.count >= options.maxAttempts) {
    return { allowed: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count += 1;
  return { allowed: true };
}

// ログイン成功時など、カウンタを明示的にリセットしたい場合に使う
export function resetRateLimit(key: string) {
  buckets.delete(key);
}
