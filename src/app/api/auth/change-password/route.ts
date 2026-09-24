import { collections } from "@/server/db";
import {
  getCurrentUser,
  hashPassword,
  revokeAllSessions,
  startSession,
  validatePassword,
  verifyPassword,
} from "@/server/auth";
import { assertSameOrigin, handler, HttpError, json, readJson } from "@/server/http";
import { rateLimit } from "@/server/rateLimit";

/**
 * POST { currentPassword, newPassword } -> changes the password of the
 * signed-in user. Signs out every other device and keeps this one signed in.
 */
export const POST = handler(async (request: Request) => {
  await assertSameOrigin();
  const user = await getCurrentUser();
  if (!user) throw new HttpError(401, "You need to be signed in to do that.");

  rateLimit(`change-password:${user._id.toHexString()}`, 10, 15 * 60 * 1000);

  const body = await readJson(request);
  const current = typeof body.currentPassword === "string" ? body.currentPassword : "";
  if (!(await verifyPassword(current, user.passwordHash))) {
    throw new HttpError(400, "Your current password is incorrect.");
  }

  const passwordError = validatePassword(body.newPassword);
  if (passwordError) throw new HttpError(400, passwordError);

  const now = new Date();
  const { users } = await collections();
  await users.updateOne(
    { _id: user._id },
    { $set: { passwordHash: await hashPassword(body.newPassword as string), updatedAt: now, passwordChangedAt: now } }
  );

  await revokeAllSessions(user._id);
  await startSession(user._id);
  return json({ ok: true });
});
