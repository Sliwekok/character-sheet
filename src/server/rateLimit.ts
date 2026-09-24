import "server-only";
import { HttpError } from "./http";

/**
 * Tiny fixed-window, in-memory rate limiter for the auth endpoints (login,
 * register, forgot password) - enough to stop password guessing and
 * reset-email spam on a single-server deployment. It resets when the
 * server restarts and isn't shared between instances; swap it for a
 * MongoDB/Redis-backed counter if this ever runs on more than one server.
 */

type Bucket = { count: number; resetAt: number };

const globals = globalThis as typeof globalThis & { __csRateLimit?: Map<string, Bucket> };
const buckets = (globals.__csRateLimit ??= new Map<string, Bucket>());

export function rateLimit(key: string, limit: number, windowMs: number): void {
  const now = Date.now();

  // Opportunistic cleanup so the map can't grow forever.
  if (buckets.size > 10_000) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
  }

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    const minutes = Math.max(1, Math.ceil((bucket.resetAt - now) / 60_000));
    throw new HttpError(429, `Too many attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`);
  }
}

/** Clears a key - e.g. after a successful login, so the failed-attempt count starts over. */
export function resetRateLimit(key: string): void {
  buckets.delete(key);
}
