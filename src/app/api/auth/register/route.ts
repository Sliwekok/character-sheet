import { ObjectId, MongoServerError } from "mongodb";
import { collections } from "@/server/db";
import {
  hashPassword,
  isValidEmail,
  normalizeEmail,
  startSession,
  toPublicUser,
  validatePassword,
} from "@/server/auth";
import { assertSameOrigin, clientIp, handler, HttpError, json, readJson } from "@/server/http";
import { rateLimit } from "@/server/rateLimit";

/** POST { email, password, displayName? } -> creates the account and signs it in. */
export const POST = handler(async (request: Request) => {
  await assertSameOrigin();
  rateLimit(`register:${await clientIp()}`, 10, 60 * 60 * 1000);

  const body = await readJson(request);
  const email = normalizeEmail(body.email);
  const password = body.password;
  const displayName =
    typeof body.displayName === "string" && body.displayName.trim()
      ? body.displayName.trim().slice(0, 60)
      : email.split("@")[0];

  if (!isValidEmail(email)) throw new HttpError(400, "Enter a valid email address.");
  const passwordError = validatePassword(password);
  if (passwordError) throw new HttpError(400, passwordError);

  const { users } = await collections();
  const now = new Date();
  const user = {
    _id: new ObjectId(),
    email,
    displayName,
    passwordHash: await hashPassword(password as string),
    createdAt: now,
    updatedAt: now,
  };

  try {
    await users.insertOne(user);
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000) {
      throw new HttpError(409, "An account with this email already exists. Try signing in instead.");
    }
    throw error;
  }

  await startSession(user._id);
  return json({ user: toPublicUser(user) }, 201);
});
