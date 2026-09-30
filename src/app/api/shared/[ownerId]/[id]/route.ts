import { getCurrentUser } from "@/server/auth";
import { getSharedCharacter } from "@/server/campaigns";
import { handler, json } from "@/server/http";

type Context = { params: Promise<{ ownerId: string; id: string }> };

/**
 * GET -> SharedCharacterView - one character, read-only. Signed-out
 * visitors can open public characters; shared ones need a fellow campaign
 * member. There is deliberately no write counterpart.
 */
export const GET = handler(async (_request: Request, { params }: Context) => {
  const user = await getCurrentUser();
  const { ownerId, id } = await params;
  return json(await getSharedCharacter(user?._id ?? null, ownerId, id));
});
