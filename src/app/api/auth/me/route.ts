import { getCurrentUser, toPublicUser } from "@/server/auth";
import { handler, json } from "@/server/http";

/** GET -> { user } for the signed-in user, or { user: null }. Never 401s - anonymous is a normal state. */
export const GET = handler(async () => {
  const user = await getCurrentUser();
  return json({ user: user ? toPublicUser(user) : null });
});
