import { getCurrentUser } from "@/server/auth";
import { getInvite, joinByInvite } from "@/server/campaigns";
import { assertSameOrigin, clientIp, handler, HttpError, json } from "@/server/http";
import { rateLimit } from "@/server/rateLimit";

type Context = { params: Promise<{ code: string }> };

const INVITE_LIMIT = 60;
const INVITE_WINDOW_MS = 10 * 60 * 1000;

/** GET -> { invite } - campaign preview for the join page. Works signed out (so it can say "sign in to join X"). */
export const GET = handler(async (_request: Request, { params }: Context) => {
  rateLimit(`invite:${await clientIp()}`, INVITE_LIMIT, INVITE_WINDOW_MS);
  const user = await getCurrentUser();
  const { code } = await params;
  return json({ invite: await getInvite(code, user?._id ?? null) });
});

/** POST -> { campaign } - joins the campaign behind this invite link. */
export const POST = handler(async (_request: Request, { params }: Context) => {
  await assertSameOrigin();
  rateLimit(`invite:${await clientIp()}`, INVITE_LIMIT, INVITE_WINDOW_MS);
  const user = await getCurrentUser();
  if (!user) throw new HttpError(401, "Sign in or create an account to join this campaign.");
  const { code } = await params;
  return json({ campaign: await joinByInvite(code, user._id) });
});
