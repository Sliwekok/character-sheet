import { ObjectId } from "mongodb";
import { collections } from "@/server/db";
import { generateToken, hashToken, isValidEmail, normalizeEmail } from "@/server/auth";
import { appBaseUrl, assertSameOrigin, clientIp, handler, HttpError, json, readJson } from "@/server/http";
import { passwordResetMail, sendMail } from "@/server/mailer";
import { rateLimit } from "@/server/rateLimit";

const RESET_TTL_MINUTES = 60;

/**
 * POST { email } -> emails a single-use reset link if the account exists.
 *
 * Always answers the same way whether or not the email is registered, so
 * this endpoint can't be used to find out who has an account.
 */
export const POST = handler(async (request: Request) => {
  await assertSameOrigin();
  const ip = await clientIp();
  const body = await readJson(request);
  const email = normalizeEmail(body.email);

  if (!isValidEmail(email)) throw new HttpError(400, "Enter a valid email address.");
  rateLimit(`forgot-ip:${ip}`, 10, 60 * 60 * 1000);
  rateLimit(`forgot-email:${email}`, 3, 15 * 60 * 1000);

  const { users, passwordResets } = await collections();
  const user = await users.findOne({ email });

  if (user) {
    // Only the newest link works - requesting again invalidates older ones.
    await passwordResets.deleteMany({ userId: user._id });

    const token = generateToken();
    const now = new Date();
    await passwordResets.insertOne({
      _id: new ObjectId(),
      userId: user._id,
      tokenHash: hashToken(token),
      createdAt: now,
      expiresAt: new Date(now.getTime() + RESET_TTL_MINUTES * 60 * 1000),
    });

    const link = `${await appBaseUrl()}/reset-password?token=${encodeURIComponent(token)}`;
    try {
      await sendMail(passwordResetMail(user.email, user.displayName, link, RESET_TTL_MINUTES));
    } catch (error) {
      console.error("[mail] failed to send password reset email:", error);
      throw new HttpError(502, "We couldn't send the email right now. Please try again in a few minutes.");
    }
  }

  return json({ ok: true });
});
