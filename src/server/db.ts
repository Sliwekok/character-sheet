import "server-only";
import { Collection, Db, MongoClient, ObjectId } from "mongodb";

/**
 * MongoDB connection + typed collections for the backend (auth + character
 * sync). Everything here is server-only - route handlers under `app/api`
 * are the only callers.
 *
 * One `MongoClient` per server process: in dev, Next's hot reload re-runs
 * module code on every edit, so the client (and the "indexes ensured"
 * promise) is parked on `globalThis` instead of a module-level `let` -
 * otherwise every save of a file would open a fresh connection pool.
 */

export interface UserDoc {
  _id: ObjectId;
  /** Always stored lowercased + trimmed - see `normalizeEmail`. Unique. */
  email: string;
  displayName: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
  /** Bumped on password change/reset - handy for auditing, not used for auth itself. */
  passwordChangedAt?: Date;
}

export interface SessionDoc {
  _id: ObjectId;
  userId: ObjectId;
  /** sha256 of the random cookie token - the raw token never touches the database. */
  tokenHash: string;
  createdAt: Date;
  /** TTL index on this field removes expired sessions automatically. */
  expiresAt: Date;
  userAgent?: string;
}

export interface PasswordResetDoc {
  _id: ObjectId;
  userId: ObjectId;
  /** sha256 of the token sent in the email link. */
  tokenHash: string;
  createdAt: Date;
  /** TTL index on this field removes expired tokens automatically. */
  expiresAt: Date;
  usedAt?: Date;
}

/**
 * One saved character, owned by one user. `data` is the whole
 * `StoredCharacter` exactly as the browser keeps it in localStorage,
 * serialized to a JSON string - characters are self-contained snapshots
 * (see utils/storage.ts), so there is nothing to normalize or query inside
 * them, and a string sidesteps MongoDB's field-name rules (character maps
 * like `featureChoices` use keys that can contain "." or start with "$").
 * The fields sync needs (`characterId`, `updatedAt`, `deletedAt`) live
 * next to it as real, indexed fields. A deleted character keeps its row as
 * a tombstone (`deletedAt` set, `data` null) so other devices learn about
 * the delete instead of re-uploading their stale local copy.
 */
export interface CharacterDoc {
  _id: ObjectId;
  userId: ObjectId;
  /** The client-generated `StoredCharacter.id` (see utils/id.ts). Unique per user. */
  characterId: string;
  /** JSON-serialized StoredCharacter, or null for a tombstone. */
  data: string | null;
  /** Character name, copied out of `data` - handy when browsing the database. */
  name?: string;
  /** Mirrors `data.updatedAt` - the last-write-wins clock for sync. */
  updatedAt: Date;
  deletedAt: Date | null;
  /** Server-side write time, for debugging/auditing only. */
  serverUpdatedAt: Date;
}

type Globals = typeof globalThis & {
  __csMongoClient?: Promise<MongoClient>;
  __csMongoIndexes?: Promise<void>;
};

const globals = globalThis as Globals;

function getClient(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set - copy .env.example to .env.local and fill it in.");
  }
  if (!globals.__csMongoClient) {
    globals.__csMongoClient = new MongoClient(uri).connect().catch((error) => {
      // Don't cache a failed connection forever - the next request retries.
      globals.__csMongoClient = undefined;
      throw error;
    });
  }
  return globals.__csMongoClient;
}

async function ensureIndexes(db: Db): Promise<void> {
  // Required: uniqueness guarantees the auth and sync code relies on.
  await Promise.all([
    db.collection<UserDoc>("users").createIndex({ email: 1 }, { unique: true }),
    db.collection<SessionDoc>("sessions").createIndex({ tokenHash: 1 }, { unique: true }),
    db.collection<SessionDoc>("sessions").createIndex({ userId: 1 }),
    db.collection<PasswordResetDoc>("passwordResets").createIndex({ tokenHash: 1 }, { unique: true }),
    db.collection<PasswordResetDoc>("passwordResets").createIndex({ userId: 1 }),
    db.collection<CharacterDoc>("characters").createIndex({ userId: 1, characterId: 1 }, { unique: true }),
  ]);

  // Nice to have: TTL indexes let MongoDB delete expired sessions/reset
  // tokens by itself. Expiry is always checked in code as well, so if the
  // server doesn't support TTL indexes (some MongoDB-compatible databases
  // don't) the app still works - expired rows just linger until cleaned up.
  const ttl = await Promise.allSettled([
    db.collection<SessionDoc>("sessions").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    db.collection<PasswordResetDoc>("passwordResets").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
  ]);
  for (const result of ttl) {
    if (result.status === "rejected") {
      console.warn("[db] couldn't create TTL index (expired sessions won't be auto-deleted):", result.reason?.message ?? result.reason);
    }
  }
}

export async function getDb(): Promise<Db> {
  const client = await getClient();
  const db = client.db(process.env.MONGODB_DB || "characterSheet");
  if (!globals.__csMongoIndexes) {
    globals.__csMongoIndexes = ensureIndexes(db).catch((error) => {
      globals.__csMongoIndexes = undefined;
      throw error;
    });
  }
  await globals.__csMongoIndexes;
  return db;
}

export async function collections(): Promise<{
  users: Collection<UserDoc>;
  sessions: Collection<SessionDoc>;
  passwordResets: Collection<PasswordResetDoc>;
  characters: Collection<CharacterDoc>;
}> {
  const db = await getDb();
  return {
    users: db.collection<UserDoc>("users"),
    sessions: db.collection<SessionDoc>("sessions"),
    passwordResets: db.collection<PasswordResetDoc>("passwordResets"),
    characters: db.collection<CharacterDoc>("characters"),
  };
}
