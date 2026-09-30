import { getCurrentUser } from "@/server/auth";
import { listSharedCharacters } from "@/server/campaigns";
import { handler, HttpError, json } from "@/server/http";

/** GET -> { campaigns: SharedCampaignCharacters[] } - other members' characters, grouped by campaign. */
export const GET = handler(async () => {
  const user = await getCurrentUser();
  if (!user) throw new HttpError(401, "You need to be signed in to see characters shared with you.");
  return json({ campaigns: await listSharedCharacters(user._id) });
});
