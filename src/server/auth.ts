import "server-only";
import { createHash, randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import { cookies, headers } from "next/headers";
import { collections, UserDoc } from "./db";
import type { PublicUser } from "@/interfaces/Auth";

/**
 * Session-cookie auth. Login/register create a random 32-byte token, send
 * it to the browser as an httpOnly cookie, and store only its sha256 in
 * `sessions` - so a leaked database dump can't be replayed as cookies.
 * Sessions are revocable (logout deletes the row; a password reset deletes
 * all of the user's rows), which is the main reason this isn't a stateless
 * JWT.
 */

export const SESSION_COOKIE = "cs_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const BCRYPT_ROUNDS = 12;

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export function normalizeEmail(email: unknown): string {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

export function isValidEmail(email: string): boolean {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Returns an error message, or null when the password is acceptable. */
export function validatePassword(password: unknown): string | null {
  if (typeof password !== "string") return "Password is required.";
  if (password.length < PASSWORD_MIN_LENGTH) return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  if (password.length > PASSWORD_MAX_LENGTH) return `Password must be at most ${PASSWORD_MAX_LENGTH} characters.`;
  return null;
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * A real bcrypt hash of a random string, compared against when the email
 * doesn't exist - keeps "unknown email" and "wrong password" taking the
 * same time, so response timing doesn't reveal which emails are registered.
 */
let dummyHash: Promise<string> | undefined;
export function getDummyHash(): Promise<string> {
  dummyHash ??= bcrypt.hash(randomBytes(16).toString("hex"), BCRYPT_ROUNDS);
  return dummyHash;
}

export function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function toPublicUser(user: UserDoc): PublicUser {
  return {
    id: user._id.toHexString(),
    email: user.email,
    displayName: user.displayName,
    createdAt: user.createdAt.toISOString(),
  };
}

/** Creates a session row and sets the cookie on the current response. */
export async function startSession(userId: ObjectId): Promise<void> {
  const { sessions } = await collections();
  const token = generateToken();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);
  const userAgent = (await headers()).get("user-agent")?.slice(0, 300) ?? undefined;

  await sessions.insertOne({
    _id: new ObjectId(),
    userId,
    tokenHash: hashToken(token),
    createdAt: now,
    expiresAt,
    userAgent,
  });

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

/** Deletes the current session row (if any) and clears the cookie. */
export async function endSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    const { sessions } = await collections();
    await sessions.deleteOne({ tokenHash: hashToken(token) });
  }
  jar.delete(SESSION_COOKIE);
}

/** The signed-in user for the current request, or null. */
export async function getCurrentUser(): Promise<UserDoc | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const { sessions, users } = await collections();
  const session = await sessions.findOne({ tokenHash: hashToken(token) });
  if (!session) return null;
  // The TTL index only sweeps about once a minute (and may not exist at
  // all - see ensureIndexes), so check expiry here too.
  if (session.expiresAt.getTime() <= Date.now()) {
    await sessions.deleteOne({ _id: session._id });
    return null;
  }

  return users.findOne({ _id: session.userId });
}

/** Revokes every session a user has - used after a password reset/change. */
export async function revokeAllSessions(userId: ObjectId): Promise<void> {
  const { sessions } = await collections();
  await sessions.deleteMany({ userId });
}
