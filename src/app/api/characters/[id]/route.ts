import { getCurrentUser } from "@/server/auth";
import { assertCharacterId, deleteCharacterRemote, getCharacter, upsertCharacter } from "@/server/characters";
import { assertSameOrigin, handler, HttpError, json, readJson } from "@/server/http";

type Context = { params: Promise<{ id: string }> };

async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new HttpError(401, "You need to be signed in to sync characters.");
  return user;
}

/** GET -> { character: RemoteCharacter } (404 if this user has never saved it). */
export const GET = handler(async (_request: Request, { params }: Context) => {
  const user = await requireUser();
  const { id } = await params;
  assertCharacterId(id);
  const remote = await getCharacter(user._id, id);
  if (!remote) throw new HttpError(404, "Character not found.");
  return json({ character: remote });
});

/** PUT { character: StoredCharacter } -> { applied, character: RemoteCharacter } (last write wins by updatedAt). */
export const PUT = handler(async (request: Request, { params }: Context) => {
  await assertSameOrigin();
  const user = await requireUser();
  const { id } = await params;
  assertCharacterId(id);
  const body = await readJson(request);
  const { applied, remote } = await upsertCharacter(user._id, id, body.character);
  return json({ applied, character: remote });
});

/** DELETE { deletedAt? } -> { applied, character } - stores a tombstone. */
export const DELETE = handler(async (request: Request, { params }: Context) => {
  await assertSameOrigin();
  const user = await requireUser();
  const { id } = await params;
  assertCharacterId(id);
  let deletedAt: unknown;
  try {
    deletedAt = ((await request.json()) as { deletedAt?: unknown })?.deletedAt;
  } catch {
    deletedAt = undefined; // body is optional
  }
  const { applied, remote } = await deleteCharacterRemote(user._id, id, deletedAt);
  return json({ applied, character: remote });
});
