import { getCurrentUser } from "@/server/auth";
import { regenerateInvite } from "@/server/campaigns";
import { assertSameOrigin, handler, HttpError, json } from "@/server/http";

type Context = { params: Promise<{ id: string }> };

/** POST -> { campaign } with a fresh invite code (owner only) - old invite links stop working. */
export const POST = handler(async (_request: Request, { params }: Context) => {
  await assertSameOrigin();
  const user = await getCurrentUser();
  if (!user) throw new HttpError(401, "You need to be signed in to use campaigns.");
  const { id } = await params;
  return json({ campaign: await regenerateInvite(user._id, id) });
});
