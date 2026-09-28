// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { RemoteCharacter } from "@/interfaces/Sync";
import type { StoredCharacter } from "@/interfaces/StoredCharacter";
import { makeStoredCharacter } from "../fixtures/characters";
import { call, createBrowser, createFetch, registerUser, signIn } from "./helpers/api";
import type { FakeBrowser } from "./helpers/requestContext";

/**
 * End to end: the browser-side sync engine (utils/sync.ts + utils/storage.ts,
 * running in jsdom) talking to the real /api/characters route handlers and
 * MongoDB, with `fetch` wired straight into the handlers. "The phone" is a
 * second signed-in session that talks to the API directly.
 */

type Sync = typeof import("@/utils/sync");
type Storage = typeof import("@/utils/storage");

let sync: Sync;
let storage: Storage;
let laptop: FakeBrowser;
let phone: FakeBrowser;
let userId: string;

const iso = (msFromNow: number) => new Date(Date.now() + msFromNow).toISOString();

async function serverCharacters(browser: FakeBrowser = phone): Promise<RemoteCharacter[]> {
  return (await call<{ characters: RemoteCharacter[] }>("/api/characters", { browser })).body.characters;
}

function phonePut(character: StoredCharacter) {
  return call(`/api/characters/${character.id}`, { browser: phone, method: "PUT", body: { character } });
}

beforeEach(async () => {
  window.localStorage.clear();
  laptop = createBrowser();
  const user = await registerUser(laptop);
  userId = user.id;
  phone = await signIn(user.email);

  vi.stubGlobal("fetch", createFetch(laptop));
  vi.resetModules();
  storage = await import("@/utils/storage");
  sync = await import("@/utils/sync");
});

afterEach(() => {
  sync.stopSync();
});

describe("sync against the real backend", () => {
  it("uploads characters created before signing in, so other devices see them", async () => {
    const offline = storage.saveCharacter(makeStoredCharacter({ name: "Made while signed out" }));

    await sync.startSync(userId);

    const onServer = await serverCharacters();
    expect(onServer).toHaveLength(1);
    expect(onServer[0].character).toEqual(offline);
    expect(sync.getSyncState()).toMatchObject({ phase: "idle", pendingCount: 0, initialPullDone: true });
  });

  it("pulls characters another device created", async () => {
    const fromPhone = makeStoredCharacter({ name: "From the phone" });
    await phonePut(fromPhone);

    await sync.startSync(userId);
    expect(storage.loadCharacter(fromPhone.id)).toEqual(fromPhone);
  });

  it("uploads later edits and deletes made on this device", async () => {
    await sync.startSync(userId);

    const c = storage.saveCharacter(makeStoredCharacter({ name: "v1" }));
    storage.saveCharacter({ ...c, name: "v2" });
    await sync.syncNow();
    expect((await serverCharacters())[0].character?.name).toBe("v2");

    storage.deleteCharacter(c.id);
    await sync.syncNow();
    expect(await serverCharacters()).toEqual([expect.objectContaining({ id: c.id, deletedAt: expect.any(String), character: null })]);
  });

  it("removes a character locally after another device deleted it", async () => {
    const c = storage.saveCharacter(makeStoredCharacter());
    await sync.startSync(userId);

    await call(`/api/characters/${c.id}`, { browser: phone, method: "DELETE", body: { deletedAt: iso(1000) } });
    await sync.syncNow();

    expect(storage.loadCharacter(c.id)).toBeUndefined();
  });

  it("resolves an edit conflict in favour of the most recent edit", async () => {
    const c = storage.saveCharacter(makeStoredCharacter({ name: "Original" }));
    await sync.startSync(userId);

    // Laptop edits (queued, not yet uploaded)...
    storage.saveCharacter({ ...storage.loadCharacter(c.id)!, name: "Laptop edit" });
    // ...but the phone's edit is newer and reaches the server first.
    await phonePut({ ...c, name: "Phone edit", updatedAt: iso(60_000) });

    await sync.syncNow();
    expect(storage.loadCharacter(c.id)?.name).toBe("Phone edit");
    expect((await serverCharacters())[0].character?.name).toBe("Phone edit");
  });

  it("signs out cleanly when the session is revoked elsewhere", async () => {
    const onUnauthorized = vi.fn();
    sync.setUnauthorizedHandler(onUnauthorized);
    await sync.startSync(userId);

    // Password changed on the phone -> every other session (the laptop's) is revoked.
    const changed = await call("/api/auth/change-password", {
      browser: phone,
      body: { currentPassword: "correct horse battery", newPassword: "a brand new password" },
    });
    expect(changed.status).toBe(200);

    const c = storage.saveCharacter(makeStoredCharacter({ name: "Unsynced" }));
    await sync.syncNow();

    expect(onUnauthorized).toHaveBeenCalledTimes(1);
    expect(sync.getSyncState().active).toBe(false);
    // Nothing lost: still local and still queued for when the same user signs back in.
    expect(storage.loadCharacter(c.id)?.name).toBe("Unsynced");
    expect(storage.readSyncQueue()[c.id]).toBeDefined();
  });
});
