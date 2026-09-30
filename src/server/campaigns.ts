import "server-only";
import { randomBytes } from "crypto";
import { ObjectId } from "mongodb";
import { CampaignDoc, CharacterDoc, collections, UserDoc } from "./db";
import { HttpError } from "./http";
import type {
  Campaign,
  CampaignInvite,
  CampaignMember,
  SharedCampaignCharacters,
  SharedCharacterView,
} from "@/interfaces/Campaign";
import type { StoredCharacter } from "@/interfaces/StoredCharacter";
import { assertCharacterId } from "./characters";

/**
 * Campaigns + read-only character sharing, used by /api/campaigns,
 * /api/invites and /api/shared. See docs/backend.md ("Sharing & campaigns").
 *
 * Access rules, all enforced here at read time:
 * - A campaign is visible only to its members; only its owner can rename,
 *   delete, regenerate the invite link or remove members.
 * - Another member's character is listed under a campaign when it's
 *   `shared` or `public` with that `campaignId` AND its owner is still a
 *   member - leaving/being removed hides it without editing the character.
 * - A single character can be opened read-only by its owner, by anyone
 *   when it's `public`, and by fellow members when it's `shared`.
 * Nobody but the owner can ever write a character - the existing
 * /api/characters routes are all scoped to the signed-in user's own rows.
 */

export const CAMPAIGN_NAME_MAX = 80;
export const CAMPAIGN_DESCRIPTION_MAX = 1000;
/** A generous cap so one user can't fill the database with empty campaigns. */
const MAX_CAMPAIGNS_PER_OWNER = 50;
const MAX_MEMBERS = 50;
const INVITE_CODE_PATTERN = /^[A-Za-z0-9_-]{16,64}$/;

function newInviteCode(): string {
  return randomBytes(18).toString("base64url"); // 24 chars, 144 bits
}

export function parseObjectId(value: unknown, what: string): ObjectId {
  if (typeof value !== "string" || !/^[a-f0-9]{24}$/.test(value)) throw new HttpError(404, `${what} not found.`);
  return new ObjectId(value);
}

function assertInviteCode(code: unknown): asserts code is string {
  if (typeof code !== "string" || !INVITE_CODE_PATTERN.test(code)) {
    throw new HttpError(404, "This invite link is invalid or has been replaced by a newer one.");
  }
}

function readName(value: unknown): string {
  const name = typeof value === "string" ? value.trim() : "";
  if (!name) throw new HttpError(400, "Give the campaign a name.");
  if (name.length > CAMPAIGN_NAME_MAX) throw new HttpError(400, `Campaign names can be at most ${CAMPAIGN_NAME_MAX} characters.`);
  return name;
}

function readDescription(value: unknown): string {
  if (value === undefined || value === null) return "";
  if (typeof value !== "string") throw new HttpError(400, "Invalid description.");
  const description = value.trim();
  if (description.length > CAMPAIGN_DESCRIPTION_MAX) {
    throw new HttpError(400, `Descriptions can be at most ${CAMPAIGN_DESCRIPTION_MAX} characters.`);
  }
  return description;
}

async function usersById(ids: ObjectId[]): Promise<Map<string, UserDoc>> {
  if (ids.length === 0) return new Map();
  const { users } = await collections();
  const unique = [...new Map(ids.map((id) => [id.toHexString(), id])).values()];
  const docs = await users.find({ _id: { $in: unique } }, { projection: { passwordHash: 0 } }).toArray();
  return new Map(docs.map((user) => [user._id.toHexString(), user as UserDoc]));
}

function member(id: ObjectId, users: Map<string, UserDoc>): CampaignMember {
  const hex = id.toHexString();
  return { id: hex, displayName: users.get(hex)?.displayName ?? "Former player" };
}

function toCampaign(doc: CampaignDoc, viewerId: ObjectId, users: Map<string, UserDoc>): Campaign {
  const isOwner = doc.ownerId.equals(viewerId);
  return {
    id: doc._id.toHexString(),
    name: doc.name,
    description: doc.description,
    owner: member(doc.ownerId, users),
    members: doc.memberIds.map((id) => member(id, users)),
    isOwner,
    inviteCode: isOwner ? doc.inviteCode : null,
    createdAt: doc.createdAt.toISOString(),
  };
}

async function presentOne(doc: CampaignDoc, viewerId: ObjectId): Promise<Campaign> {
  return toCampaign(doc, viewerId, await usersById(doc.memberIds));
}

/** Loads a campaign the user is a member of - 404 otherwise (non-members can't tell it exists). */
async function findAsMember(userId: ObjectId, campaignId: string): Promise<CampaignDoc> {
  const { campaigns } = await collections();
  const doc = await campaigns.findOne({ _id: parseObjectId(campaignId, "Campaign"), memberIds: userId });
  if (!doc) throw new HttpError(404, "Campaign not found.");
  return doc;
}

async function findAsOwner(userId: ObjectId, campaignId: string): Promise<CampaignDoc> {
  const doc = await findAsMember(userId, campaignId);
  if (!doc.ownerId.equals(userId)) throw new HttpError(403, "Only the campaign's creator can do that.");
  return doc;
}

// ---------------------------------------------------------------------------
// Campaign CRUD
// ---------------------------------------------------------------------------

export async function listCampaigns(userId: ObjectId): Promise<Campaign[]> {
  const { campaigns } = await collections();
  const docs = await campaigns.find({ memberIds: userId }).sort({ createdAt: 1 }).toArray();
  const users = await usersById(docs.flatMap((doc) => doc.memberIds));
  return docs.map((doc) => toCampaign(doc, userId, users));
}

export async function getCampaign(userId: ObjectId, campaignId: string): Promise<Campaign> {
  return presentOne(await findAsMember(userId, campaignId), userId);
}

export async function createCampaign(userId: ObjectId, input: Record<string, unknown>): Promise<Campaign> {
  const name = readName(input.name);
  const description = readDescription(input.description);
  const { campaigns } = await collections();
  if ((await campaigns.countDocuments({ ownerId: userId })) >= MAX_CAMPAIGNS_PER_OWNER) {
    throw new HttpError(400, `You can create at most ${MAX_CAMPAIGNS_PER_OWNER} campaigns.`);
  }
  const now = new Date();
  const doc: CampaignDoc = {
    _id: new ObjectId(),
    name,
    description,
    ownerId: userId,
    memberIds: [userId],
    inviteCode: newInviteCode(),
    createdAt: now,
    updatedAt: now,
  };
  await campaigns.insertOne(doc);
  return presentOne(doc, userId);
}

export async function updateCampaign(userId: ObjectId, campaignId: string, input: Record<string, unknown>): Promise<Campaign> {
  const doc = await findAsOwner(userId, campaignId);
  const patch: Partial<CampaignDoc> = { updatedAt: new Date() };
  if (input.name !== undefined) patch.name = readName(input.name);
  if (input.description !== undefined) patch.description = readDescription(input.description);
  const { campaigns } = await collections();
  await campaigns.updateOne({ _id: doc._id }, { $set: patch });
  return presentOne({ ...doc, ...patch }, userId);
}

/**
 * Deletes the campaign. Characters that pointed at it aren't edited (they
 * belong to their owners and live in their browsers too) - they simply
 * stop being listed anywhere, and a "shared" one is visible to nobody but
 * its owner until they pick another campaign.
 */
export async function deleteCampaign(userId: ObjectId, campaignId: string): Promise<void> {
  const doc = await findAsOwner(userId, campaignId);
  const { campaigns } = await collections();
  await campaigns.deleteOne({ _id: doc._id });
}

/** Replaces the invite code - every previously shared link stops working. */
export async function regenerateInvite(userId: ObjectId, campaignId: string): Promise<Campaign> {
  const doc = await findAsOwner(userId, campaignId);
  const inviteCode = newInviteCode();
  const updatedAt = new Date();
  const { campaigns } = await collections();
  await campaigns.updateOne({ _id: doc._id }, { $set: { inviteCode, updatedAt } });
  return presentOne({ ...doc, inviteCode, updatedAt }, userId);
}

/**
 * Removes `memberId` from the campaign. Members may remove themselves
 * (leave); only the owner may remove someone else. The owner can't leave
 * their own campaign - they delete it instead.
 */
export async function removeMember(userId: ObjectId, campaignId: string, memberIdInput: string): Promise<void> {
  const doc = await findAsMember(userId, campaignId);
  const memberId = parseObjectId(memberIdInput, "Member");
  const isSelf = memberId.equals(userId);
  const isOwner = doc.ownerId.equals(userId);
  if (!isSelf && !isOwner) throw new HttpError(403, "Only the campaign's creator can remove players.");
  if (memberId.equals(doc.ownerId)) {
    throw new HttpError(400, "The campaign's creator can't leave it - delete the campaign instead.");
  }
  if (!doc.memberIds.some((id) => id.equals(memberId))) throw new HttpError(404, "That player isn't in this campaign.");
  const { campaigns } = await collections();
  await campaigns.updateOne({ _id: doc._id }, { $pull: { memberIds: memberId }, $set: { updatedAt: new Date() } });
}

// ---------------------------------------------------------------------------
// Invite links
// ---------------------------------------------------------------------------

export async function getInvite(code: unknown, viewerId: ObjectId | null): Promise<CampaignInvite> {
  assertInviteCode(code);
  const { campaigns } = await collections();
  const doc = await campaigns.findOne({ inviteCode: code });
  if (!doc) throw new HttpError(404, "This invite link is invalid or has been replaced by a newer one.");
  const owner = (await usersById([doc.ownerId])).get(doc.ownerId.toHexString());
  return {
    campaignId: doc._id.toHexString(),
    name: doc.name,
    description: doc.description,
    ownerName: owner?.displayName ?? "Unknown",
    memberCount: doc.memberIds.length,
    isMember: viewerId ? doc.memberIds.some((id) => id.equals(viewerId)) : false,
  };
}

/** Joins the campaign behind an invite code. Joining twice is a harmless no-op. */
export async function joinByInvite(code: unknown, userId: ObjectId): Promise<Campaign> {
  assertInviteCode(code);
  const { campaigns } = await collections();
  const doc = await campaigns.findOne({ inviteCode: code });
  if (!doc) throw new HttpError(404, "This invite link is invalid or has been replaced by a newer one.");
  if (doc.memberIds.some((id) => id.equals(userId))) return presentOne(doc, userId);
  if (doc.memberIds.length >= MAX_MEMBERS) throw new HttpError(400, "This campaign is full.");
  const updated = await campaigns.findOneAndUpdate(
    { _id: doc._id, inviteCode: code },
    { $addToSet: { memberIds: userId }, $set: { updatedAt: new Date() } },
    { returnDocument: "after" }
  );
  if (!updated) throw new HttpError(404, "This invite link is invalid or has been replaced by a newer one.");
  return presentOne(updated, userId);
}

// ---------------------------------------------------------------------------
// Shared characters (read-only)
// ---------------------------------------------------------------------------

function parseData(doc: CharacterDoc): StoredCharacter | null {
  if (!doc.data) return null;
  try {
    return JSON.parse(doc.data) as StoredCharacter;
  } catch {
    return null;
  }
}

/**
 * Other members' characters in every campaign the user belongs to, grouped
 * by campaign (campaigns with nothing shared yet are included, empty, so
 * /home can show "nobody has shared a character yet").
 */
export async function listSharedCharacters(userId: ObjectId): Promise<SharedCampaignCharacters[]> {
  const { campaigns, characters } = await collections();
  const memberOf = await campaigns.find({ memberIds: userId }).sort({ createdAt: 1 }).toArray();
  if (memberOf.length === 0) return [];

  const campaignIds = memberOf.map((doc) => doc._id.toHexString());
  const docs = await characters
    .find({
      campaignId: { $in: campaignIds },
      visibility: { $in: ["shared", "public"] },
      deletedAt: null,
      userId: { $ne: userId },
    })
    .sort({ name: 1 })
    .toArray();

  const users = await usersById(docs.map((doc) => doc.userId));
  return memberOf.map((campaign) => {
    const id = campaign._id.toHexString();
    const entries = docs
      .filter((doc) => doc.campaignId === id && campaign.memberIds.some((memberId) => memberId.equals(doc.userId)))
      .map((doc) => {
        const character = parseData(doc);
        return character ? { owner: member(doc.userId, users), character } : null;
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
    return { campaignId: id, campaignName: campaign.name, characters: entries };
  });
}

/**
 * One character, read-only, if `viewerId` (null = signed out) may see it.
 * Anything not viewable is a 404 so ids of private characters can't be
 * probed.
 */
export async function getSharedCharacter(
  viewerId: ObjectId | null,
  ownerIdInput: string,
  characterId: string
): Promise<SharedCharacterView> {
  assertCharacterId(characterId);
  const ownerId = parseObjectId(ownerIdInput, "Character");
  const { characters, campaigns } = await collections();
  const doc = await characters.findOne({ userId: ownerId, characterId, deletedAt: null });
  const character = doc ? parseData(doc) : null;
  if (!doc || !character) throw new HttpError(404, "Character not found, or it isn't shared with you.");

  const isOwner = viewerId !== null && viewerId.equals(ownerId);
  const visibility = doc.visibility ?? "private";
  const campaign =
    doc.campaignId && visibility !== "private"
      ? await campaigns.findOne({ _id: new ObjectId(doc.campaignId), memberIds: ownerId })
      : null;
  const viewerInCampaign = Boolean(campaign && viewerId && campaign.memberIds.some((id) => id.equals(viewerId)));

  const allowed = isOwner || visibility === "public" || (visibility === "shared" && viewerInCampaign);
  if (!allowed) throw new HttpError(404, "Character not found, or it isn't shared with you.");

  const owner = member(ownerId, await usersById([ownerId]));
  return {
    character,
    owner,
    // Only fellow members (and the owner) learn which campaign it's in.
    campaign: campaign && (isOwner || viewerInCampaign) ? { id: campaign._id.toHexString(), name: campaign.name } : null,
    isOwner,
  };
}
