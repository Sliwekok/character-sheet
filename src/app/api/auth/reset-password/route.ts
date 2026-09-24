import { collections } from "@/server/db";
import {
  hashPassword,
  hashToken,
  revokeAllSessions,
  startSession,
  toPublicUser,
  validatePassword,
} from "@/server/auth";
import { assertSameOrigin, clientIp, handler, HttpError, json, readJson } from "@/server/http";
import { rateLimit } from "@/server/rateLimit";

const INVALID_LINK = "This reset link is invalid or has expired. Request a new one.";

async function findValidReset(token: unknown) {
  if (typeof token !== "string" || token.length < 20 || token.length > 200) return null;
  const { passwordResets } = await collections();
  const reset = await passwordResets.findOne({ tokenHash: hashToken(token) });
  if (!reset || reset.usedAt || reset.expiresAt.getTime() <= Date.now()) return null;
  return reset;
}

/** GET ?token=... -> { valid } so the reset page can say "link expired" before the user types a new password. */
export const GET = handler(async (request: Request) => {
  rateLimit(`reset-check:${await clientIp()}`, 30, 15 * 60 * 1000);
  const token = new URL(request.url).searchParams.get("token");
  return json({ valid: Boolean(await findValidReset(token)) });
});

/**
 * POST { token, password } -> sets the new password, signs out every other
 * device (all sessions revoked), and signs this browser in.
 */
export const POST = handler(async (request: Request) => {
  await assertSameOrigin();
  rateLimit(`reset:${await clientIp()}`, 10, 15 * 60 * 1000);

  const body = await readJson(request);
  const passwordError = validatePassword(body.password);
  if (passwordError) throw new HttpError(400, passwordError);

  const reset = await findValidReset(body.token);
  if (!reset) throw new HttpError(400, INVALID_LINK);

  const { users, passwordResets } = await collections();

  // Claim the token atomically so two simultaneous submits can't both use it.
  const claimed = await passwordResets.findOneAndUpdate(
    { _id: reset._id, usedAt: { $exists: false } },
    { $set: { usedAt: new Date() } }
  );
  if (!claimed) throw new HttpError(400, INVALID_LINK);

  const now = new Date();
  const user = await users.findOneAndUpdate(
    { _id: reset.userId },
    { $set: { passwordHash: await hashPassword(body.password as string), updatedAt: now, passwordChangedAt: now } },
    { returnDocument: "after" }
  );
  if (!user) throw new HttpError(400, INVALID_LINK);

  await passwordResets.deleteMany({ userId: user._id });
  await revokeAllSessions(user._id);
  await startSession(user._id);

  return json({ user: toPublicUser(user) });
});
