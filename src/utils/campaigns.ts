import type {
    Campaign,
    CampaignInvite,
    CharacterVisibility,
    SharedCampaignCharacters,
    SharedCharacterView,
} from "@/interfaces/Campaign";
import { normalizeVisibility } from "@/interfaces/Campaign";
import type { StoredCharacter } from "@/interfaces/StoredCharacter";
import { apiFetch } from "./api";

/**
 * Browser-side client for campaigns and read-only character sharing - see
 * server/campaigns.ts for the rules the server enforces.
 */

export const VISIBILITY_LABELS: Record<CharacterVisibility, string> = {
    private: "Private",
    shared: "Shared with campaign",
    public: "Public link",
};

export const VISIBILITY_DESCRIPTIONS: Record<CharacterVisibility, string> = {
    private: "Only you can see this character.",
    shared: "Members of the chosen campaign can view it (read-only).",
    public: "Anyone with the link can view it (read-only), no account needed.",
};

export interface CharacterSharing {
    visibility: CharacterVisibility;
    campaignId: string | null;
}

export function getCharacterSharing(character: Pick<StoredCharacter, "visibility" | "campaignId">): CharacterSharing {
    const visibility = normalizeVisibility(character.visibility);
    return { visibility, campaignId: visibility === "private" ? null : character.campaignId ?? null };
}

/** The sharing fields to spread onto a character - clears the campaign when going private. */
export function sharingPatch(sharing: CharacterSharing): Pick<StoredCharacter, "visibility" | "campaignId"> {
    return {
        visibility: sharing.visibility,
        campaignId: sharing.visibility === "private" ? null : sharing.campaignId,
    };
}

/** "Shared" without a campaign would be visible to nobody - the pickers block saving that. */
export function isSharingComplete(sharing: CharacterSharing): boolean {
    return sharing.visibility !== "shared" || Boolean(sharing.campaignId);
}

/** Read-only link to one of the signed-in user's characters. */
export function characterShareUrl(ownerId: string, characterId: string): string {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/character/${encodeURIComponent(characterId)}?owner=${encodeURIComponent(ownerId)}`;
}

export function campaignInviteUrl(inviteCode: string): string {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/join/${encodeURIComponent(inviteCode)}`;
}

export async function copyToClipboard(text: string): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        return false;
    }
}

export async function fetchCampaigns(): Promise<Campaign[]> {
    return (await apiFetch<{ campaigns: Campaign[] }>("/api/campaigns")).campaigns;
}

export async function createCampaign(input: { name: string; description?: string }): Promise<Campaign> {
    return (await apiFetch<{ campaign: Campaign }>("/api/campaigns", { method: "POST", body: input })).campaign;
}

export async function updateCampaign(id: string, input: { name?: string; description?: string }): Promise<Campaign> {
    return (await apiFetch<{ campaign: Campaign }>(`/api/campaigns/${id}`, { method: "PUT", body: input })).campaign;
}

export async function deleteCampaign(id: string): Promise<void> {
    await apiFetch(`/api/campaigns/${id}`, { method: "DELETE" });
}

export async function regenerateInvite(id: string): Promise<Campaign> {
    return (await apiFetch<{ campaign: Campaign }>(`/api/campaigns/${id}/invite`, { method: "POST" })).campaign;
}

/** Leave (your own id) or remove a player (owner only). */
export async function removeCampaignMember(campaignId: string, memberId: string): Promise<void> {
    await apiFetch(`/api/campaigns/${campaignId}/members/${memberId}`, { method: "DELETE" });
}

export async function fetchInvite(code: string): Promise<CampaignInvite> {
    return (await apiFetch<{ invite: CampaignInvite }>(`/api/invites/${encodeURIComponent(code)}`)).invite;
}

export async function joinCampaign(code: string): Promise<Campaign> {
    return (await apiFetch<{ campaign: Campaign }>(`/api/invites/${encodeURIComponent(code)}`, { method: "POST" })).campaign;
}

export async function fetchSharedCharacters(): Promise<SharedCampaignCharacters[]> {
    return (await apiFetch<{ campaigns: SharedCampaignCharacters[] }>("/api/shared")).campaigns;
}

export async function fetchSharedCharacter(ownerId: string, characterId: string): Promise<SharedCharacterView> {
    return apiFetch<SharedCharacterView>(
        `/api/shared/${encodeURIComponent(ownerId)}/${encodeURIComponent(characterId)}`
    );
}
