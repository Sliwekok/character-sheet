import { collections } from "@/server/db";
import { getDummyHash, normalizeEmail, startSession, toPublicUser, verifyPassword } from "@/server/auth";
import { assertSameOrigin, clientIp, handler, HttpError, json, readJson } from "@/server/http";
import { rateLimit, resetRateLimit } from "@/server/rateLimit";

const INVALID = "That email and password don't match any account.";

/** POST { email, password } -> signs in (sets the session cookie). */
export const POST = handler(async (request: Request) => {
  await assertSameOrigin();
  const ip = await clientIp();
  const body = await readJson(request);
  const email = normalizeEmail(body.email);
  const password = typeof body.password === "string" ? body.password : "";

  // Per email+IP (guessing one account) and per IP (spraying many accounts).
  const accountKey = `login:${ip}:${email}`;
  rateLimit(accountKey, 10, 15 * 60 * 1000);
  rateLimit(`login-ip:${ip}`, 50, 15 * 60 * 1000);

  if (!email || !password) throw new HttpError(400, "Enter your email and password.");

  const { users } = await collections();
  const user = await users.findOne({ email });
  // Always run one bcrypt compare so unknown emails take as long as wrong passwords.
  const ok = await verifyPassword(password, user?.passwordHash ?? (await getDummyHash()));
  if (!user || !ok) throw new HttpError(401, INVALID);

  resetRateLimit(accountKey);
  await startSession(user._id);
  return json({ user: toPublicUser(user) });
});
