import { Character } from "@/interfaces/Characters";
import type { CharacterVisibility } from "@/interfaces/Campaign";

/**
 * A `Character` as persisted by the app - adds the bookkeeping fields
 * `localStorage` persistence needs (an id to key off of, and timestamps)
 * without touching the domain-model `Character` shape itself. Every
 * character read from/written to storage (see `utils/storage.ts`) is a
 * `StoredCharacter`; every character produced by the generator (manual or
 * random, see `utils/characterDraft.ts` / `utils/randomCharacter.ts`) is
 * one too, so the two paths always agree on shape.
 */
export interface StoredCharacter extends Character {
    id: string;
    createdAt: string;
    updatedAt: string;
    /**
     * Who else can view this character (read-only) - see
     * interfaces/Campaign.ts. Missing = "private". Travels with the
     * character through sync, so the server can enforce it.
     */
    visibility?: CharacterVisibility;
    /**
     * The campaign a "shared" (required) or "public" (optional) character
     * is shown in. Ignored while `visibility` is "private".
     */
    campaignId?: string | null;
}
