// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { RemoteCharacter } from "@/interfaces/Sync";
import type { StoredCharacter } from "@/interfaces/StoredCharacter";
import { makeStoredCharacter } from "../../tests/fixtures/characters";

/**
 * utils/sync.ts against a scriptable in-memory fake of the /api/characters
 * endpoints (the real endpoints are exercised end-to-end in
 * tests/integration/sync.test.ts). sync.ts keeps module-level state, so
 * every test imports fresh copies of it and storage.ts.
 */

type Sync = typeof import("./sync");
type Storage = typeof import("./storage");

let sync: Sync;
let storage: Storage;

interface FakeServer {
  characters: Map<string, RemoteCharacter>;
  requests: { method: string; path: string; body?: unknown }[];
  /** Return a Response (or throw) to override the default behaviour for one request. */
  intercept?: (method: string, path: string) => Response | undefined;
}

let server: FakeServer;

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

function remote(character: StoredCharacter): RemoteCharacter {
  return { id: character.id, updatedAt: character.updatedAt, deletedAt: null, character };
}

function tombstone(id: string, deletedAt: string, updatedAt = deletedAt): RemoteCharacter {
  return { id, updatedAt, deletedAt, character: null };
}

/** Minimal last-write-wins server, same rules as src/server/characters.ts. */
function handle(method: string, path: string, body: Record<string, unknown> | undefined): Response {
  if (method === "GET" && path === "/api/characters") return json({ characters: [...server.characters.values()] });

  const id = decodeURIComponent(path.replace("/api/characters/", ""));
  const existing = server.characters.get(id);

  if (method === "GET") return existing ? json({ character: existing }) : json({ error: "Character not found." }, 404);

  if (method === "PUT") {
    const character = body!.character as StoredCharacter;
    const clock = existing ? Math.max(Date.parse(existing.updatedAt), existing.deletedAt ? Date.parse(existing.deletedAt) : 0) : 0;
    if (existing && Date.parse(character.updatedAt) < clock) return json({ applied: false, character: existing });
    const stored = remote(character);
    server.characters.set(id, stored);
    return json({ applied: true, character: stored });
  }

  if (method === "DELETE") {
    const deletedAt = (body?.deletedAt as string) ?? new Date().toISOString();
    if (existing && !existing.deletedAt && existing.updatedAt > deletedAt) return json({ applied: false, character: existing });
    const stored = tombstone(id, deletedAt, existing?.updatedAt ?? deletedAt);
    server.characters.set(id, stored);
    return json({ applied: true, character: stored });
  }

  return json({ error: "unexpected" }, 500);
}

const fetchMock = vi.fn(async (input: RequestInfo | URL, init: RequestInit = {}) => {
  const path = String(input);
  const method = init.method ?? "GET";
  const body = typeof init.body === "string" ? JSON.parse(init.body) : undefined;
  server.requests.push({ method, path, body });
  const overridden = server.intercept?.(method, path);
  if (overridden) return overridden;
  return handle(method, path, body);
});

const requestsBy = (method: string) => server.requests.filter((r) => r.method === method);
const iso = (msFromNow: number) => new Date(Date.now() + msFromNow).toISOString();

/** Puts characters straight into localStorage, bypassing saveCharacter's re-stamping. */
function seedLocal(characters: StoredCharacter[], linkedTo?: string) {
  window.localStorage.setItem("character-sheet:characters:v1", JSON.stringify(characters));
  if (linkedTo) window.localStorage.setItem("character-sheet:account:v1", linkedTo);
}

beforeEach(async () => {
  window.localStorage.clear();
  server = { characters: new Map(), requests: [] };
  fetchMock.mockClear();
  vi.stubGlobal("fetch", fetchMock);
  vi.resetModules();
  storage = await import("./storage");
  sync = await import("./sync");
});

afterEach(() => {
  sync.stopSync();
  vi.useRealTimers();
});

describe("startSync", () => {
  it("claims characters made while signed out and uploads them", async () => {
    const a = makeStoredCharacter({ name: "Made offline" });
    seedLocal([a]);

    await sync.startSync("user-1");

    expect(storage.getLinkedAccount()).toBe("user-1");
    expect(requestsBy("PUT")).toEqual([{ method: "PUT", path: `/api/characters/${a.id}`, body: { character: a } }]);
    expect(server.characters.get(a.id)?.character?.name).toBe("Made offline");
    expect(storage.readSyncQueue()).toEqual({});
    expect(sync.getSyncState()).toMatchObject({
      active: true,
      phase: "idle",
      initialPullDone: true,
      pendingCount: 0,
      error: null,
      lastSyncedAt: expect.any(String),
    });
  });

  it("downloads characters that only exist on the server", async () => {
    const fromOtherDevice = makeStoredCharacter({ name: "From my phone" });
    server.characters.set(fromOtherDevice.id, remote(fromOtherDevice));

    await sync.startSync("user-1");

    expect(storage.loadCharacter(fromOtherDevice.id)).toEqual(fromOtherDevice);
    expect(requestsBy("PUT")).toEqual([]); // pulled copies aren't re-uploaded
  });

  it("replaces another account's characters instead of merging them", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const someoneElses = makeStoredCharacter({ name: "Not mine" });
    seedLocal([someoneElses], "user-2");

    await sync.startSync("user-1");

    expect(storage.loadCharacter(someoneElses.id)).toBeUndefined();
    expect(requestsBy("PUT")).toEqual([]);
    expect(storage.getLinkedAccount()).toBe("user-1");
  });

  it("keeps the local copy when it's newer than the server's", async () => {
    const serverCopy = makeStoredCharacter({ name: "Old on server", updatedAt: iso(-60_000) });
    server.characters.set(serverCopy.id, remote(serverCopy));
    seedLocal([{ ...serverCopy, name: "Newer locally", updatedAt: iso(0) }], "user-1");

    await sync.startSync("user-1");
    expect(storage.loadCharacter(serverCopy.id)?.name).toBe("Newer locally");
  });

  it("applies server tombstones for characters not edited locally since", async () => {
    const c = makeStoredCharacter({ updatedAt: iso(-60_000) });
    seedLocal([c], "user-1");
    server.characters.set(c.id, tombstone(c.id, iso(-1000), c.updatedAt));

    await sync.startSync("user-1");
    expect(storage.loadCharacter(c.id)).toBeUndefined();
  });

  it("notifies subscribers on state changes", async () => {
    const listener = vi.fn();
    const unsubscribe = sync.subscribeSync(listener);
    await sync.startSync("user-1");
    expect(listener).toHaveBeenCalled();
    unsubscribe();
    listener.mockClear();
    await sync.syncNow();
    expect(listener).not.toHaveBeenCalled();
  });
});

describe("uploading local changes", () => {
  it("debounces rapid saves into a single upload about a second later", async () => {
    await sync.startSync("user-1");
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });

    let c = storage.saveCharacter(makeStoredCharacter({ name: "v1" }));
    c = storage.saveCharacter({ ...c, name: "v2" });
    c = storage.saveCharacter({ ...c, name: "v3" });
    await vi.advanceTimersByTimeAsync(900);
    expect(requestsBy("PUT")).toHaveLength(0);
    expect(sync.getSyncState().pendingCount).toBe(1);

    await vi.advanceTimersByTimeAsync(200);
    await vi.waitFor(() => expect(requestsBy("PUT")).toHaveLength(1));
    expect(server.characters.get(c.id)?.character?.name).toBe("v3");
    await vi.waitFor(() => expect(sync.getSyncState().pendingCount).toBe(0));
  });

  it("uploads deletes with the time they happened", async () => {
    const c = makeStoredCharacter();
    server.characters.set(c.id, remote(c));
    await sync.startSync("user-1");

    storage.deleteCharacter(c.id);
    const deletedAt = (storage.readSyncQueue()[c.id] as { deletedAt: string }).deletedAt;
    await sync.syncNow();

    expect(requestsBy("DELETE")).toEqual([{ method: "DELETE", path: `/api/characters/${c.id}`, body: { deletedAt } }]);
    expect(server.characters.get(c.id)?.deletedAt).toBe(deletedAt);
  });

  it("adopts the server's version when the server rejects a stale upload", async () => {
    await sync.startSync("user-1");
    const c = storage.saveCharacter(makeStoredCharacter({ name: "Stale local edit" }));
    // Another device saved a newer edit in the meantime.
    server.characters.set(c.id, remote({ ...c, name: "Newer from phone", updatedAt: iso(60_000) }));

    await sync.flushBeforeSignOut();
    expect(storage.loadCharacter(c.id)?.name).toBe("Newer from phone");
  });

  it("drops the local copy when the server says it was deleted later", async () => {
    await sync.startSync("user-1");
    const c = storage.saveCharacter(makeStoredCharacter());
    server.characters.set(c.id, tombstone(c.id, iso(60_000), iso(-1000)));

    await sync.flushBeforeSignOut();
    expect(storage.loadCharacter(c.id)).toBeUndefined();
  });

  it("restores a character whose delete lost to a newer edit elsewhere", async () => {
    const c = makeStoredCharacter({ name: "Edited on phone" });
    seedLocal([c], "user-1");
    await sync.startSync("user-1");

    storage.deleteCharacter(c.id);
    server.characters.set(c.id, remote({ ...c, updatedAt: iso(60_000) }));
    await sync.flushBeforeSignOut();

    expect(storage.loadCharacter(c.id)?.name).toBe("Edited on phone");
  });

  it("drops an upload the server permanently rejects and carries on with the rest", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const tooBig = makeStoredCharacter({ name: "Huge" });
    const fine = makeStoredCharacter({ name: "Fine" });
    seedLocal([tooBig, fine]);
    server.intercept = (method, path) =>
      method === "PUT" && path.endsWith(tooBig.id) ? json({ error: "This character is too large to sync." }, 413) : undefined;

    await sync.startSync("user-1");

    expect(storage.readSyncQueue()).toEqual({});
    expect(server.characters.has(fine.id)).toBe(true);
    expect(server.characters.has(tooBig.id)).toBe(false);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining(tooBig.id), expect.any(String));
    expect(sync.getSyncState().phase).toBe("idle");
  });
});

describe("failures", () => {
  it("goes 'offline' and keeps the outbox when the server can't be reached", async () => {
    const c = makeStoredCharacter();
    seedLocal([c]);
    server.intercept = () => {
      throw new TypeError("Failed to fetch");
    };

    await sync.startSync("user-1");

    expect(sync.getSyncState()).toMatchObject({ phase: "offline", initialPullDone: true, pendingCount: 1 });
    expect(storage.readSyncQueue()[c.id]).toBeDefined();

    // Back online -> the "online" event triggers a full sync.
    server.intercept = undefined;
    window.dispatchEvent(new Event("online"));
    await vi.waitFor(() => expect(sync.getSyncState()).toMatchObject({ phase: "idle", pendingCount: 0 }));
    expect(server.characters.has(c.id)).toBe(true);
  });

  it("shows the server's message on a 5xx and retries later", async () => {
    seedLocal([makeStoredCharacter()]);
    server.intercept = () => json({ error: "Something went wrong on the server. Please try again." }, 500);

    await sync.startSync("user-1");
    expect(sync.getSyncState()).toMatchObject({ phase: "error", error: "Something went wrong on the server. Please try again." });
    expect(sync.getSyncState().pendingCount).toBe(1);
  });

  it("stops syncing and reports a 401 (expired session) without touching local data", async () => {
    const onUnauthorized = vi.fn();
    sync.setUnauthorizedHandler(onUnauthorized);
    const c = makeStoredCharacter();
    seedLocal([c]);
    server.intercept = () => json({ error: "You need to be signed in to sync characters." }, 401);

    await sync.startSync("user-1");

    expect(onUnauthorized).toHaveBeenCalledTimes(1);
    expect(sync.getSyncState().active).toBe(false);
    expect(storage.loadCharacter(c.id)).toBeDefined();
    expect(storage.readSyncQueue()[c.id]).toBeDefined();
    expect(storage.getLinkedAccount()).toBe("user-1");
  });
});

describe("signing out", () => {
  it("flushBeforeSignOut reports how many changes couldn't be uploaded", async () => {
    await sync.startSync("user-1");
    storage.saveCharacter(makeStoredCharacter());
    server.intercept = () => json({ error: "down" }, 503);
    expect(await sync.flushBeforeSignOut()).toBe(1);

    server.intercept = undefined;
    expect(await sync.flushBeforeSignOut()).toBe(0);
  });

  it("signOutCleanup stops syncing and removes this account's characters", async () => {
    seedLocal([makeStoredCharacter()]);
    await sync.startSync("user-1");

    sync.signOutCleanup();
    expect(storage.loadCharacters()).toEqual([]);
    expect(storage.getLinkedAccount()).toBeNull();
    expect(sync.getSyncState()).toMatchObject({ active: false, pendingCount: 0, lastSyncedAt: null });

    // No more uploads after sign-out.
    storage.saveCharacter(makeStoredCharacter());
    await new Promise((resolve) => setTimeout(resolve, 1100));
    expect(requestsBy("PUT")).toHaveLength(1);
  });
});

describe("fetchCharacterFromServer", () => {
  it("stores and returns a character that isn't on this device yet", async () => {
    const c = makeStoredCharacter({ name: "Linked from another device" });
    server.characters.set(c.id, remote(c));

    await expect(sync.fetchCharacterFromServer(c.id)).resolves.toEqual(c);
    expect(storage.loadCharacter(c.id)).toEqual(c);
  });

  it("resolves undefined for unknown or deleted characters", async () => {
    server.characters.set("gone", tombstone("gone", iso(0)));
    await expect(sync.fetchCharacterFromServer("missing")).resolves.toBeUndefined();
    await expect(sync.fetchCharacterFromServer("gone")).resolves.toBeUndefined();
    expect(storage.loadCharacters()).toEqual([]);
  });

  it("treats a 401 as signed out", async () => {
    const onUnauthorized = vi.fn();
    sync.setUnauthorizedHandler(onUnauthorized);
    server.intercept = () => json({ error: "nope" }, 401);
    await expect(sync.fetchCharacterFromServer("x")).resolves.toBeUndefined();
    expect(onUnauthorized).toHaveBeenCalled();
  });

  it("rethrows other errors", async () => {
    server.intercept = () => json({ error: "boom" }, 500);
    await expect(sync.fetchCharacterFromServer("x")).rejects.toMatchObject({ status: 500, message: "boom" });
  });
});
