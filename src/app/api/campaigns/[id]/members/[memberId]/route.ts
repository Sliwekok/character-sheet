import { getCurrentUser } from "@/server/auth";
import { removeMember } from "@/server/campaigns";
import { assertSameOrigin, handler, HttpError, json } from "@/server/http";

type Context = { params: Promise<{ id: string; memberId: string }> };

/**
 * DELETE -> { ok: true }. Your own id = leave the campaign; someone else's
 * id = remove them (owner only).
 */
export const DELETE = handler(async (_request: Request, { params }: Context) => {
  await assertSameOrigin();
  const user = await getCurrentUser();
  if (!user) throw new HttpError(401, "You need to be signed in to use campaigns.");
  const { id, memberId } = await params;
  await removeMember(user._id, id, memberId);
  return json({ ok: true });
});
