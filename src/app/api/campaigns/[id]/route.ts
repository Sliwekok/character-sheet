import { getCurrentUser } from "@/server/auth";
import { deleteCampaign, getCampaign, updateCampaign } from "@/server/campaigns";
import { assertSameOrigin, handler, HttpError, json, readJson } from "@/server/http";

type Context = { params: Promise<{ id: string }> };

async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new HttpError(401, "You need to be signed in to use campaigns.");
  return user;
}

/** GET -> { campaign } (members only; 404 for everyone else). */
export const GET = handler(async (_request: Request, { params }: Context) => {
  const user = await requireUser();
  const { id } = await params;
  return json({ campaign: await getCampaign(user._id, id) });
});

/** PUT { name?, description? } -> { campaign } (owner only). */
export const PUT = handler(async (request: Request, { params }: Context) => {
  await assertSameOrigin();
  const user = await requireUser();
  const { id } = await params;
  const body = await readJson(request);
  return json({ campaign: await updateCampaign(user._id, id, body) });
});

/** DELETE -> { ok: true } (owner only). */
export const DELETE = handler(async (_request: Request, { params }: Context) => {
  await assertSameOrigin();
  const user = await requireUser();
  const { id } = await params;
  await deleteCampaign(user._id, id);
  return json({ ok: true });
});
