import "server-only";
import { ObjectId } from "mongodb";
import { CharacterDoc, collections } from "./db";
import { HttpError } from "./http";
import type { RemoteCharacter } from "@/interfaces/Sync";

/** Server-side character persistence shared by the /api/characters routes. */

const MAX_CHARACTER_BYTES = 2 * 1024 * 1024; // generous - a big multiclass sheet is ~100-300 KB
const ID_PATTERN = /^[A-Za-z0-9_-]{1,100}$/;

export function assertCharacterId(id: unknown): asserts id is string {
  if (typeof id !== "string" || !ID_PATTERN.test(id)) throw new HttpError(400, "Invalid character id.");
}

function parseDate(value: unknown, field: string): Date {
  const date = typeof value === "string" ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) throw new HttpError(400, `Character ${field} is missing or invalid.`);
  return date;
}

export function toRemote(doc: CharacterDoc): RemoteCharacter {
  return {
    id: doc.characterId,
    updatedAt: doc.updatedAt.toISOString(),
    deletedAt: doc.deletedAt ? doc.deletedAt.toISOString() : null,
    character: doc.data ? (JSON.parse(doc.data) as RemoteCharacter["character"]) : null,
  };
}

export async function listCharacters(userId: ObjectId): Promise<RemoteCharacter[]> {
  const { characters } = await collections();
  const docs = await characters.find({ userId }).sort({ updatedAt: -1 }).toArray();
  return docs.map(toRemote);
}

export async function getCharacter(userId: ObjectId, characterId: string): Promise<RemoteCharacter | null> {
  const { characters } = await collections();
  const doc = await characters.findOne({ userId, characterId });
  return doc ? toRemote(doc) : null;
}

/**
 * Last-write-wins upsert: the incoming character is stored only if its
 * `updatedAt` is newer than (or equal to) what the server has - including a
 * tombstone's `deletedAt`, so a stale device can't resurrect a character
 * another device deleted. Returns what the server holds afterwards and
 * whether the incoming write was the one kept.
 */
export async function upsertCharacter(
  userId: ObjectId,
  characterId: string,
  character: unknown
): Promise<{ applied: boolean; remote: RemoteCharacter }> {
  if (!character || typeof character !== "object" || Array.isArray(character)) {
    throw new HttpError(400, "Missing character data.");
  }
  const data = character as Record<string, unknown>;
  if (data.id !== characterId) throw new HttpError(400, "Character id in the body doesn't match the URL.");
  const serialized = JSON.stringify(data);
  if (Buffer.byteLength(serialized, "utf8") > MAX_CHARACTER_BYTES) {
    throw new HttpError(413, "This character is too large to sync.");
  }
  const updatedAt = parseDate(data.updatedAt, "updatedAt");
  parseDate(data.createdAt, "createdAt");

  const { characters } = await collections();
  const existing = await characters.findOne({ userId, characterId });
  if (existing) {
    const serverClock = Math.max(existing.updatedAt.getTime(), existing.deletedAt?.getTime() ?? 0);
    if (updatedAt.getTime() < serverClock) return { applied: false, remote: toRemote(existing) };
  }

  const doc: CharacterDoc = {
    _id: existing?._id ?? new ObjectId(),
    userId,
    characterId,
    data: serialized,
    name: typeof data.name === "string" ? data.name.slice(0, 200) : undefined,
    updatedAt,
    deletedAt: null,
    serverUpdatedAt: new Date(),
  };
  await characters.replaceOne({ userId, characterId }, doc, { upsert: true });
  return { applied: true, remote: toRemote(doc) };
}

/**
 * Turns the character into a tombstone. `deletedAt` comes from the client
 * (when it was deleted there) so an offline delete that syncs later is
 * still ordered correctly against edits made elsewhere in the meantime.
 */
export async function deleteCharacterRemote(
  userId: ObjectId,
  characterId: string,
  deletedAtInput: unknown
): Promise<{ applied: boolean; remote: RemoteCharacter | null }> {
  const now = new Date();
  let deletedAt = typeof deletedAtInput === "string" ? new Date(deletedAtInput) : now;
  if (Number.isNaN(deletedAt.getTime()) || deletedAt.getTime() > now.getTime() + 5 * 60 * 1000) deletedAt = now;

  const { characters } = await collections();
  const existing = await characters.findOne({ userId, characterId });
  if (existing && existing.updatedAt.getTime() > deletedAt.getTime() && !existing.deletedAt) {
    // Edited somewhere else after this delete happened - keep the edit.
    return { applied: false, remote: toRemote(existing) };
  }

  const doc: CharacterDoc = {
    _id: existing?._id ?? new ObjectId(),
    userId,
    characterId,
    data: null,
    updatedAt: existing?.updatedAt ?? deletedAt,
    deletedAt,
    serverUpdatedAt: now,
  };
  await characters.replaceOne({ userId, characterId }, doc, { upsert: true });
  return { applied: true, remote: toRemote(doc) };
}
