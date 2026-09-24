import { StoredCharacter } from "@/interfaces/StoredCharacter";

/**
 * Local-first character persistence.
 *
 * The browser's `localStorage` is still the source of truth the UI reads
 * from - every page loads characters from here synchronously, exactly as it
 * did before there was a backend, and works the same with or without an
 * account. When the player is signed in, `utils/sync.ts` mirrors these
 * characters to the server in the background: every local write below is
 * recorded in a small "outbox" (the pending-sync queue) that sync.ts
 * uploads, and characters fetched from the server are written back in with
 * `applyRemoteChanges` (which doesn't re-queue them).
 *
 * The public API (`loadCharacters`/`loadCharacter`/`saveCharacter`/
 * `deleteCharacter`) is unchanged and still synchronous, so callers such
 * as the character page's in-place `setCharacter(current => saveCharacter(...))`
 * updates didn't need to change at all.
 *
 * The `v1` suffix on the keys is there on purpose: bump it if
 * `StoredCharacter`'s shape ever changes in a way old saved JSON can't
 * satisfy, so stale data doesn't get silently mis-read.
 */
const STORAGE_KEY = "character-sheet:characters:v1";
/** Pending uploads/deletes for the linked account - see `PendingOp`. */
const QUEUE_KEY = "character-sheet:sync-queue:v1";
/** Id of the account the local characters belong to (null/missing = not linked to any account). */
const ACCOUNT_KEY = "character-sheet:account:v1";

/** Fired on `window` whenever the stored characters change (dispatched in a microtask - see `emitChange`). */
export const CHARACTERS_CHANGED_EVENT = "character-sheet:characters-changed";

export interface CharactersChangedDetail {
    ids: string[];
    /** "local" = a change made on this device; "remote" = written in by sync from the server. */
    source: "local" | "remote";
}

/**
 * One queued sync operation. `seq` increases on every write so sync.ts can
 * tell whether an entry was overwritten while its upload was in flight (and
 * must be uploaded again) before removing it from the queue.
 */
export type PendingOp =
    | { op: "upsert"; seq: number }
    | { op: "delete"; seq: number; deletedAt: string };

export type SyncQueue = Record<string, PendingOp>;

/** True outside the browser (SSR/build) - every function below no-ops safely in that case. */
function hasStorage(): boolean {
    return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readJson<T>(key: string, fallback: T): T {
    try {
        const raw = window.localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
        return fallback;
    }
}

/**
 * Notifies listeners (the character list, an open character sheet, the
 * sync engine) that characters changed. Deferred to a microtask on
 * purpose: `saveCharacter` is often called from inside a React state
 * updater, which runs during render, and listeners that set state of their
 * own must not run in the middle of another component's render.
 */
function emitChange(detail: CharactersChangedDetail): void {
    if (typeof window === "undefined" || detail.ids.length === 0) return;
    queueMicrotask(() => {
        window.dispatchEvent(new CustomEvent<CharactersChangedDetail>(CHARACTERS_CHANGED_EVENT, { detail }));
    });
}

function readAll(): StoredCharacter[] {
    const parsed = readJson<unknown>(STORAGE_KEY, []);
    // Corrupt/foreign JSON under our key - fail soft rather than crash the character list.
    return Array.isArray(parsed) ? (parsed as StoredCharacter[]) : [];
}

function writeAll(characters: StoredCharacter[]): void {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(characters));
}

// ---------------------------------------------------------------------------
// Public character API (unchanged signatures)
// ---------------------------------------------------------------------------

/** All saved characters, newest-updated first. Returns `[]` on the server, on first run, or if the stored JSON is corrupt. */
export function loadCharacters(): StoredCharacter[] {
    if (!hasStorage()) return [];
    return [...readAll()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function loadCharacter(id: string): StoredCharacter | undefined {
    if (!hasStorage()) return undefined;
    return readAll().find((character) => character.id === id);
}

/**
 * Insert-or-update by `id`. Always stamps `updatedAt` to now; on an update,
 * `createdAt` is pinned to whatever was already stored (not whatever the
 * caller passed in) so re-finalizing an edited draft - which has no memory
 * of the original creation time - can't accidentally reset it.
 *
 * `updatedAt` doubles as the sync clock: when the same character is edited
 * on two devices, the most recent edit wins.
 */
export function saveCharacter(character: StoredCharacter): StoredCharacter {
    if (!hasStorage()) return character;

    const existing = readAll();
    const index = existing.findIndex((c) => c.id === character.id);
    const createdAt = index === -1 ? character.createdAt : existing[index].createdAt;
    const stamped: StoredCharacter = { ...character, createdAt, updatedAt: new Date().toISOString() };

    const next = index === -1
        ? [...existing, stamped]
        : existing.map((c, i) => (i === index ? stamped : c));

    writeAll(next);
    enqueue(stamped.id, { op: "upsert" });
    emitChange({ ids: [stamped.id], source: "local" });
    return stamped;
}

export function deleteCharacter(id: string): void {
    if (!hasStorage()) return;

    writeAll(readAll().filter((character) => character.id !== id));
    enqueue(id, { op: "delete", deletedAt: new Date().toISOString() });
    emitChange({ ids: [id], source: "local" });
}

// ---------------------------------------------------------------------------
// Sync bookkeeping (used by utils/sync.ts)
// ---------------------------------------------------------------------------

/** The account id the local characters are linked to, or null when they belong to no account. */
export function getLinkedAccount(): string | null {
    if (!hasStorage()) return null;
    return window.localStorage.getItem(ACCOUNT_KEY);
}

export function setLinkedAccount(userId: string | null): void {
    if (!hasStorage()) return;
    if (userId) window.localStorage.setItem(ACCOUNT_KEY, userId);
    else window.localStorage.removeItem(ACCOUNT_KEY);
}

export function readSyncQueue(): SyncQueue {
    if (!hasStorage()) return {};
    const queue = readJson<unknown>(QUEUE_KEY, {});
    return queue && typeof queue === "object" && !Array.isArray(queue) ? (queue as SyncQueue) : {};
}

function writeSyncQueue(queue: SyncQueue): void {
    if (Object.keys(queue).length === 0) window.localStorage.removeItem(QUEUE_KEY);
    else window.localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

let seqCounter = Date.now();

/**
 * Records a pending sync op - only while the local characters are linked
 * to an account. Anonymous players' characters never enter the queue; if
 * they sign in later, `claimLocalCharactersForAccount` queues them all at once.
 */
function enqueue(id: string, op: { op: "upsert" } | { op: "delete"; deletedAt: string }): void {
    if (!getLinkedAccount()) return;
    const queue = readSyncQueue();
    queue[id] = { ...op, seq: ++seqCounter };
    writeSyncQueue(queue);
}

/** Removes a queue entry after it synced - unless it was overwritten (newer `seq`) in the meantime. */
export function completeSyncOp(id: string, seq: number): void {
    if (!hasStorage()) return;
    const queue = readSyncQueue();
    if (queue[id] && queue[id].seq === seq) {
        delete queue[id];
        writeSyncQueue(queue);
    }
}

/** Links the current local characters to `userId` and queues all of them for upload. */
export function claimLocalCharactersForAccount(userId: string): void {
    if (!hasStorage()) return;
    setLinkedAccount(userId);
    const queue = readSyncQueue();
    for (const character of readAll()) {
        queue[character.id] ??= { op: "upsert", seq: ++seqCounter };
    }
    writeSyncQueue(queue);
}

/**
 * Writes characters that came from the server into local storage without
 * re-queueing them for upload or re-stamping `updatedAt`. `upserts`
 * replace/insert by id; `deletes` remove by id.
 */
export function applyRemoteChanges(upserts: StoredCharacter[], deletes: string[]): void {
    if (!hasStorage() || (upserts.length === 0 && deletes.length === 0)) return;

    const byId = new Map(readAll().map((character) => [character.id, character]));
    for (const id of deletes) byId.delete(id);
    for (const character of upserts) byId.set(character.id, character);
    writeAll([...byId.values()]);

    emitChange({ ids: [...upserts.map((c) => c.id), ...deletes], source: "remote" });
}

/**
 * Wipes every local character and the sync bookkeeping - used on sign-out
 * (so the next person on this browser doesn't see, or accidentally claim,
 * this account's characters) and when a different account signs in.
 */
export function clearLocalCharacters(): void {
    if (!hasStorage()) return;
    const ids = readAll().map((character) => character.id);
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(QUEUE_KEY);
    window.localStorage.removeItem(ACCOUNT_KEY);
    emitChange({ ids, source: "remote" });
}
