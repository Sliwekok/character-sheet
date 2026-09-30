import { getCurrentUser } from "@/server/auth";
import { createCampaign, listCampaigns } from "@/server/campaigns";
import { assertSameOrigin, handler, HttpError, json, readJson } from "@/server/http";

async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new HttpError(401, "You need to be signed in to use campaigns.");
  return user;
}

/** GET -> { campaigns: Campaign[] } - every campaign the signed-in user is a member of. */
export const GET = handler(async () => {
  const user = await requireUser();
  return json({ campaigns: await listCampaigns(user._id) });
});

/** POST { name, description? } -> 201 { campaign } - the creator becomes its owner and first member. */
export const POST = handler(async (request: Request) => {
  await assertSameOrigin();
  const user = await requireUser();
  const body = await readJson(request);
  return json({ campaign: await createCampaign(user._id, body) }, 201);
});
