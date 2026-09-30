import { randomBytes } from "node:crypto";
import { afterAll, beforeAll, beforeEach, inject, vi } from "vitest";

/**
 * Per-file setup for the integration project.
 *
 * Route handlers run for real (handler -> server/auth -> server/db ->
 * MongoDB). Only two things are swapped out:
 *
 * - `next/headers`: outside a Next.js request there is no request scope, so
 *   `cookies()`/`headers()` read from the fake browser that
 *   tests/integration/helpers/api.ts sets up for each call.
 * - `bcryptjs`: forced down to 4 rounds (from 12) purely for speed. Hashes
 *   are still real bcrypt hashes and still verified for real.
 */

vi.mock("next/headers", async () => {
  const { currentRequest } = await import("./helpers/requestContext");
  return {
    headers: async () => currentRequest().headers,
    cookies: async () => {
      const { browser } = currentRequest();
      return {
        get: (name: string) => {
          const value = browser.cookies.get(name);
          return value === undefined ? undefined : { name, value };
        },
        set: (name: string, value: string, options: Record<string, unknown> = {}) => {
          browser.cookies.set(name, value);
          browser.cookieOptions.set(name, options);
        },
        delete: (name: string) => {
          browser.cookies.delete(name);
          browser.cookieOptions.delete(name);
        },
      };
    },
  };
});

vi.mock("bcryptjs", async (importOriginal) => {
  const actual = (await importOriginal()) as { default?: typeof import("bcryptjs") } & typeof import("bcryptjs");
  const bcrypt = actual.default ?? actual;
  const fast = { ...bcrypt, hash: (value: string) => bcrypt.hash(value, 4) };
  return { ...fast, default: fast };
});

type ServerGlobals = typeof globalThis & {
  __csMongoClient?: Promise<import("mongodb").MongoClient>;
  __csMongoIndexes?: Promise<void>;
  __csRateLimit?: Map<string, unknown>;
};
const g = globalThis as ServerGlobals;

beforeAll(() => {
  process.env.MONGODB_URI = inject("mongoUri");
  // One throwaway database per test file, so files can run in parallel.
  process.env.MONGODB_DB = `cs_test_${randomBytes(4).toString("hex")}`;
  delete process.env.APP_URL;
  delete process.env.SMTP_HOST;
  // A worker may be reused between files - never inherit its connection or "indexes done" flag.
  g.__csMongoClient = undefined;
  g.__csMongoIndexes = undefined;
});

beforeEach(async () => {
  g.__csRateLimit?.clear();
  const { getDb } = await import("@/server/db");
  const db = await getDb();
  await Promise.all(
    ["users", "sessions", "passwordResets", "characters", "campaigns"].map((name) => db.collection(name).deleteMany({}))
  );
});

afterAll(async () => {
  const client = await g.__csMongoClient?.catch(() => undefined);
  if (client) {
    await client.db(process.env.MONGODB_DB).dropDatabase().catch(() => undefined);
    await client.close();
  }
  g.__csMongoClient = undefined;
  g.__csMongoIndexes = undefined;
});
