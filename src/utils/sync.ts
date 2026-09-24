"use client";

import { RemoteCharacter } from "@/interfaces/Sync";
import { StoredCharacter } from "@/interfaces/StoredCharacter";
import { ApiError, apiFetch } from "@/utils/api";
import {
    applyRemoteChanges,
    CHARACTERS_CHANGED_EVENT,
    CharactersChangedDetail,
    claimLocalCharactersForAccount,
    clearLocalCharacters,
    completeSyncOp,
    getLinkedAccount,
    loadCharacter,
    loadCharacters,
    PendingOp,
    readSyncQueue,
} from "@/utils/storage";

/**
 * Background sync between localStorage (see utils/storage.ts - still what
 * every page reads) and the signed-in user's characters on the server.
 *
 * - Local first: pages render from localStorage immediately; nothing waits
 *   for the network unless the character simply isn't on this device yet.
 * - Every local save/delete lands in the outbox and is uploaded ~1s later
 *   (debounced, so rapid clicks on the sheet become one request).
 * - A full sync (upload outbox -> download everything -> upload anything
 *   still pending) runs when a user signs in, when the app opens with a
 *   session, when the browser comes back online, and when the tab regains
 *   focus (at most once a minute).
 * - Conflicts are last-write-wins by `updatedAt`, deletes included.
 *
 * `AuthProvider` (components/auth/AuthProvider.tsx) drives this with
 * `startSync(userId)` / `stopSync()`; UI reads status with `useSyncStatus`.
 */

export type SyncPhase = "idle" | "syncing" | "error" | "offline";

export interface SyncState {
    /** True while a user is signed in and sync is running. */
    active: boolean;
    phase: SyncPhase;
    /** False until the first download from the server after sign-in/app start has finished (or failed). */
    initialPullDone: boolean;
    lastSyncedAt: string | null;
    error: string | null;
    /** Local changes not yet on the server. */
    pendingCount: number;
}

const FLUSH_DELAY_MS = 1000;
const FOCUS_PULL_INTERVAL_MS = 60_000;

let state: SyncState = {
    active: false,
    phase: "idle",
    initialPullDone: false,
    lastSyncedAt: null,
    error: null,
    pendingCount: 0,
};

const listeners = new Set<() => void>();
let currentUserId: string | null = null;
let flushTimer: ReturnType<typeof setTimeout> | undefined;
let running: Promise<void> | null = null;
let rerunRequested = false;
let lastPullAt = 0;
let onUnauthorized: (() => void) | null = null;

function setState(patch: Partial<SyncState>): void {
    state = { ...state, ...patch };
    listeners.forEach((listener) => listener());
}

function refreshPendingCount(): void {
    const pendingCount = Object.keys(readSyncQueue()).length;
    if (pendingCount !== state.pendingCount) setState({ pendingCount });
}

export function getSyncState(): SyncState {
    return state;
}

export function subscribeSync(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

/** Called by AuthProvider so an expired session (401 mid-sync) flips the app back to signed-out. */
export function setUnauthorizedHandler(handler: (() => void) | null): void {
    onUnauthorized = handler;
}

// ---------------------------------------------------------------------------
// Network steps
// ---------------------------------------------------------------------------

/** Uploads every queued op. Throws on network/server failure (entries stay queued for next time). */
async function flushQueue(): Promise<void> {
    const queue = readSyncQueue();

    for (const [id, entry] of Object.entries(queue)) {
        if (!currentUserId) return;

        try {
            await syncOne(id, entry);
        } catch (error) {
            // A request the server rejects outright (malformed/too large
            // character) will never succeed - drop it rather than letting
            // it block every op queued behind it forever. Network errors,
            // 401, 429 and 5xx are retried on the next cycle instead.
            const permanent = error instanceof ApiError && [400, 404, 409, 413, 422].includes(error.status);
            if (!permanent) throw error;
            console.warn(`[sync] server rejected character ${id}, not retrying:`, (error as Error).message);
        }

        completeSyncOp(id, entry.seq);
        refreshPendingCount();
    }
}

async function syncOne(id: string, entry: PendingOp): Promise<void> {
    if (entry.op === "delete") {
        const result = await apiFetch<{ applied: boolean; character: RemoteCharacter | null }>(
            `/api/characters/${encodeURIComponent(id)}`,
            { method: "DELETE", body: { deletedAt: entry.deletedAt } }
        );
        // Rejected = it was edited on another device after this delete; bring that edit back.
        if (!result.applied && result.character?.character) applyRemoteChanges([result.character.character], []);
        return;
    }

    const local = loadCharacter(id);
    if (!local) return; // deleted again locally since - the delete op replaced this one anyway
    const result = await apiFetch<{ applied: boolean; character: RemoteCharacter }>(
        `/api/characters/${encodeURIComponent(id)}`,
        { method: "PUT", body: { character: local } }
    );
    if (!result.applied) applyServerVersion(result.character);
}

/** Server said "I have something newer" - make the local copy match it. */
function applyServerVersion(remote: RemoteCharacter): void {
    if (remote.deletedAt) applyRemoteChanges([], [remote.id]);
    else if (remote.character) applyRemoteChanges([remote.character], []);
}

/** Downloads everything and merges it into localStorage (never overwriting a newer or still-pending local change). */
async function pull(): Promise<void> {
    const { characters: remote } = await apiFetch<{ characters: RemoteCharacter[] }>("/api/characters");
    const queue = readSyncQueue();
    const localById = new Map(loadCharacters().map((c) => [c.id, c]));

    const upserts: StoredCharacter[] = [];
    const deletes: string[] = [];

    for (const entry of remote) {
        if (queue[entry.id]) continue; // local change pending - it'll be uploaded and win or lose on the server
        const local = localById.get(entry.id);

        if (entry.deletedAt) {
            if (local && local.updatedAt <= entry.deletedAt) deletes.push(entry.id);
        } else if (entry.character && (!local || entry.updatedAt > local.updatedAt)) {
            upserts.push(entry.character);
        }
    }

    applyRemoteChanges(upserts, deletes);
    lastPullAt = Date.now();
}

/**
 * Runs one sync cycle, or piggybacks on the one already running (and asks
 * it to go around once more, so a change made mid-sync isn't missed).
 */
function runSync(withPull: boolean): Promise<void> {
    if (!currentUserId) return Promise.resolve();
    if (running) {
        rerunRequested = true;
        return running;
    }

    running = (async () => {
        setState({ phase: "syncing", error: null });
        try {
            do {
                rerunRequested = false;
                await flushQueue();
                if (withPull) {
                    await pull();
                    await flushQueue();
                    withPull = false;
                }
            } while (rerunRequested && currentUserId);

            setState({
                phase: "idle",
                error: null,
                lastSyncedAt: new Date().toISOString(),
                initialPullDone: true,
            });
        } catch (error) {
            if (error instanceof ApiError && error.status === 401) {
                // Session expired/revoked elsewhere. Local characters stay put
                // (still linked to the account, outbox intact) and sync
                // resumes when the same user signs in again.
                stopSync();
                onUnauthorized?.();
                return;
            }
            const offline = error instanceof ApiError && error.status === 0;
            setState({
                phase: offline ? "offline" : "error",
                error: error instanceof Error ? error.message : "Sync failed.",
                initialPullDone: true,
            });
        } finally {
            running = null;
            refreshPendingCount();
        }
    })();

    return running;
}

function scheduleFlush(): void {
    clearTimeout(flushTimer);
    flushTimer = setTimeout(() => void runSync(false), FLUSH_DELAY_MS);
}

// ---------------------------------------------------------------------------
// Browser event wiring
// ---------------------------------------------------------------------------

function handleCharactersChanged(event: Event): void {
    const detail = (event as CustomEvent<CharactersChangedDetail>).detail;
    refreshPendingCount();
    if (detail?.source === "local" && currentUserId) scheduleFlush();
}

function handleOnline(): void {
    void runSync(true);
}

function handleVisibility(): void {
    if (document.visibilityState === "visible" && Date.now() - lastPullAt > FOCUS_PULL_INTERVAL_MS) {
        void runSync(true);
    }
}

let wired = false;
function wireBrowserEvents(on: boolean): void {
    if (typeof window === "undefined" || wired === on) return;
    wired = on;
    const method = on ? "addEventListener" : "removeEventListener";
    window[method](CHARACTERS_CHANGED_EVENT, handleCharactersChanged);
    window[method]("online", handleOnline);
    document[method]("visibilitychange", handleVisibility);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Starts syncing for `userId`. Decides what to do with whatever is already
 * in localStorage first:
 * - not linked to any account (made while signed out) -> claimed by this
 *   account and uploaded;
 * - linked to this same account -> kept, outbox uploaded;
 * - linked to a different account -> replaced by this account's characters
 *   (they belong to someone else and must not be merged in).
 */
export function startSync(userId: string): Promise<void> {
    if (typeof window === "undefined") return Promise.resolve();
    if (currentUserId === userId) return runSync(true);

    const linked = getLinkedAccount();
    if (linked && linked !== userId) {
        console.warn("[sync] local characters belong to another account - replacing them with this account's.");
        clearLocalCharacters();
    }
    if (getLinkedAccount() !== userId) claimLocalCharactersForAccount(userId);

    currentUserId = userId;
    wireBrowserEvents(true);
    setState({ active: true, initialPullDone: false, error: null });
    refreshPendingCount();
    return runSync(true);
}

/** Stops syncing (signed out / session expired). Leaves local data alone - see `signOutCleanup`. */
export function stopSync(): void {
    currentUserId = null;
    clearTimeout(flushTimer);
    wireBrowserEvents(false);
    setState({ active: false, phase: "idle", initialPullDone: false, error: null });
}

/** "Sync now" button. */
export function syncNow(): Promise<void> {
    return runSync(true);
}

/**
 * Before signing out: tries to upload the outbox. Returns how many local
 * changes are still not on the server afterwards (0 = safe to clear).
 */
export async function flushBeforeSignOut(): Promise<number> {
    clearTimeout(flushTimer);
    await runSync(false);
    return Object.keys(readSyncQueue()).length;
}

/** After signing out: removes this account's characters from this browser. */
export function signOutCleanup(): void {
    stopSync();
    clearLocalCharacters();
    setState({ pendingCount: 0, lastSyncedAt: null });
}

/**
 * Fetches one character from the server and stores it locally - for when a
 * signed-in player opens a character that isn't on this device yet (e.g. a
 * link from another device). Resolves to undefined if the server doesn't
 * have it (or it was deleted).
 */
export async function fetchCharacterFromServer(id: string): Promise<StoredCharacter | undefined> {
    try {
        const { character } = await apiFetch<{ character: RemoteCharacter }>(`/api/characters/${encodeURIComponent(id)}`);
        if (!character.character || character.deletedAt) return undefined;
        applyRemoteChanges([character.character], []);
        return character.character;
    } catch (error) {
        if (error instanceof ApiError && error.status === 404) return undefined;
        if (error instanceof ApiError && error.status === 401) {
            stopSync();
            onUnauthorized?.();
            return undefined;
        }
        throw error;
    }
}
