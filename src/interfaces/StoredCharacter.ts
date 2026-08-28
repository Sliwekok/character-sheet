import { Character } from "@/interfaces/Characters";

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
}
