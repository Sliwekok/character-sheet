import { endSession } from "@/server/auth";
import { assertSameOrigin, handler, json } from "@/server/http";

/** POST -> ends the current session and clears the cookie. Always succeeds. */
export const POST = handler(async () => {
  await assertSameOrigin();
  await endSession();
  return json({ ok: true });
});
