import { StoredCharacter } from "@/interfaces/StoredCharacter";

/**
 * Everything the generator produces lives in the browser's `localStorage`
 * under this one key, as a JSON array - there's no backend (see
 * docs/architecture.md), so this is the whole persistence layer. The `v1`
 * suffix is there on purpose: bump it if `StoredCharacter`'s shape ever
 * changes in a way old saved JSON can't satisfy, so stale data doesn't get
 * silently mis-read instead of just starting fresh.
 */
const STORAGE_KEY = "character-sheet:characters:v1";

/** True outside the browser (SSR/build) - every function below no-ops safely in that case. */
function hasStorage(): boolean {
    return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

/** All saved characters, newest-updated first. Returns `[]` on the server, on first run, or if the stored JSON is corrupt. */
export function loadCharacters(): StoredCharacter[] {
    if (!hasStorage()) return [];

    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];

        const parsed = JSON.parse(raw) as StoredCharacter[];
        if (!Array.isArray(parsed)) return [];

        return [...parsed].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    } catch {
        // Corrupt/foreign JSON under our key - fail soft rather than crash the character list.
        return [];
    }
}

export function loadCharacter(id: string): StoredCharacter | undefined {
    return loadCharacters().find((character) => character.id === id);
}

/**
 * Insert-or-update by `id`. Always stamps `updatedAt` to now; on an update,
 * `createdAt` is pinned to whatever was already stored (not whatever the
 * caller passed in) so re-finalizing an edited draft - which has no memory
 * of the original creation time - can't accidentally reset it.
 */
export function saveCharacter(character: StoredCharacter): StoredCharacter {
    if (!hasStorage()) return character;

    const existing = loadCharacters();
    const index = existing.findIndex((c) => c.id === character.id);
    const createdAt = index === -1 ? character.createdAt : existing[index].createdAt;
    const stamped: StoredCharacter = { ...character, createdAt, updatedAt: new Date().toISOString() };

    const next = index === -1
        ? [...existing, stamped]
        : existing.map((c, i) => (i === index ? stamped : c));

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return stamped;
}

export function deleteCharacter(id: string): void {
    if (!hasStorage()) return;

    const next = loadCharacters().filter((character) => character.id !== id);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}
