import { getCurrentUser } from "@/server/auth";
import { listCharacters } from "@/server/characters";
import { handler, HttpError, json } from "@/server/http";

/** GET -> { characters: RemoteCharacter[] } - every character (and tombstone) of the signed-in user. */
export const GET = handler(async () => {
  const user = await getCurrentUser();
  if (!user) throw new HttpError(401, "You need to be signed in to sync characters.");
  return json({ characters: await listCharacters(user._id) });
});
