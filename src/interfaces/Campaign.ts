import { StoredCharacter } from "./StoredCharacter";

/**
 * Who can see a character besides its owner - see docs/backend.md
 * ("Sharing & campaigns").
 *
 * - `private` - only the owner (the default; also what every character
 *   saved before sharing existed is treated as).
 * - `shared`  - the owner plus every member of `campaignId`'s campaign.
 * - `public`  - anyone who has the link, even without an account. If a
 *   campaign is picked too, it's also listed for that campaign's members.
 *
 * Visibility only has an effect for characters synced to an account -
 * a signed-out player's characters never leave their browser.
 */
export type CharacterVisibility = "private" | "shared" | "public";

export const CHARACTER_VISIBILITIES: CharacterVisibility[] = ["private", "shared", "public"];

export function normalizeVisibility(value: unknown): CharacterVisibility {
    return value === "shared" || value === "public" ? value : "private";
}

export interface CampaignMember {
    id: string;
    displayName: string;
}

/** A campaign as the API returns it to one of its members. */
export interface Campaign {
    id: string;
    name: string;
    description: string;
    owner: CampaignMember;
    /** Every member, owner included, in join order. */
    members: CampaignMember[];
    /** True when the signed-in user created (and so manages) this campaign. */
    isOwner: boolean;
    /** The secret part of the invite link - only sent to the owner, null for everyone else. */
    inviteCode: string | null;
    createdAt: string;
}

/** What someone opening an invite link sees before joining. */
export interface CampaignInvite {
    campaignId: string;
    name: string;
    description: string;
    ownerName: string;
    memberCount: number;
    /** Whether the signed-in user is already a member (false when signed out). */
    isMember: boolean;
}

/** Another member's character, as listed under a campaign on /home. */
export interface SharedCharacterEntry {
    owner: CampaignMember;
    character: StoredCharacter;
}

export interface SharedCampaignCharacters {
    campaignId: string;
    campaignName: string;
    characters: SharedCharacterEntry[];
}

/** A character opened read-only through a share link / campaign. */
export interface SharedCharacterView {
    character: StoredCharacter;
    owner: CampaignMember;
    campaign: { id: string; name: string } | null;
    /** True when the viewer is the character's owner (the page then offers to open the editable copy). */
    isOwner: boolean;
}
