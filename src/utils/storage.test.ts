// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { StoredCharacter } from "@/interfaces/StoredCharacter";
import { makeStoredCharacter } from "../../tests/fixtures/characters";
import {
  applyRemoteChanges,
  CHARACTERS_CHANGED_EVENT,
  CharactersChangedDetail,
  claimLocalCharactersForAccount,
  clearLocalCharacters,
  completeSyncOp,
  deleteCharacter,
  getLinkedAccount,
  loadCharacter,
  loadCharacters,
  readSyncQueue,
  saveCharacter,
  setLinkedAccount,
} from "./storage";

const STORAGE_KEY = "character-sheet:characters:v1";

/** Collects CHARACTERS_CHANGED_EVENT details (they're dispatched in a microtask). */
function captureChanges() {
  const events: CharactersChangedDetail[] = [];
  const listener = (event: Event) => events.push((event as CustomEvent<CharactersChangedDetail>).detail);
  window.addEventListener(CHARACTERS_CHANGED_EVENT, listener);
  return { events, stop: () => window.removeEventListener(CHARACTERS_CHANGED_EVENT, listener) };
}

const flushMicrotasks = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("loadCharacters / loadCharacter", () => {
  it("returns [] on first run", () => {
    expect(loadCharacters()).toEqual([]);
    expect(loadCharacter("nope")).toBeUndefined();
  });

  it("fails soft on corrupt or foreign JSON", () => {
    window.localStorage.setItem(STORAGE_KEY, "{not json");
    expect(loadCharacters()).toEqual([]);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ not: "an array" }));
    expect(loadCharacters()).toEqual([]);
  });

  it("sorts newest-updated first", () => {
    const a = makeStoredCharacter({ name: "A", updatedAt: "2026-01-01T00:00:00.000Z" });
    const b = makeStoredCharacter({ name: "B", updatedAt: "2026-03-01T00:00:00.000Z" });
    const c = makeStoredCharacter({ name: "C", updatedAt: "2026-02-01T00:00:00.000Z" });
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([a, b, c]));
    expect(loadCharacters().map((x) => x.name)).toEqual(["B", "C", "A"]);
  });
});

describe("saveCharacter", () => {
  it("inserts a new character and stamps updatedAt to now", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-09-25T12:00:00.000Z"));
    const c = makeStoredCharacter({ updatedAt: "2020-01-01T00:00:00.000Z" });

    const saved = saveCharacter(c);
    expect(saved.updatedAt).toBe("2026-09-25T12:00:00.000Z");
    expect(loadCharacter(c.id)).toEqual(saved);
  });

  it("updates in place and pins createdAt to the originally stored value", () => {
    const original = saveCharacter(makeStoredCharacter({ name: "Before", createdAt: "2025-01-01T00:00:00.000Z" }));
    const updated = saveCharacter({ ...original, name: "After", createdAt: "2099-01-01T00:00:00.000Z" });

    expect(loadCharacters()).toHaveLength(1);
    expect(updated.name).toBe("After");
    expect(updated.createdAt).toBe("2025-01-01T00:00:00.000Z");
  });

  it("emits a 'local' change event asynchronously", async () => {
    const { events, stop } = captureChanges();
    const c = saveCharacter(makeStoredCharacter());
    expect(events).toEqual([]); // not during the call - it may run inside a React state updater
    await flushMicrotasks();
    expect(events).toEqual([{ ids: [c.id], source: "local" }]);
    stop();
  });
});

describe("deleteCharacter", () => {
  it("removes the character and emits a change", async () => {
    const keep = saveCharacter(makeStoredCharacter({ name: "Keep" }));
    const gone = saveCharacter(makeStoredCharacter({ name: "Gone" }));
    await flushMicrotasks(); // let the saves' own events go out first
    const { events, stop } = captureChanges();

    deleteCharacter(gone.id);
    expect(loadCharacters().map((c) => c.id)).toEqual([keep.id]);
    await flushMicrotasks();
    expect(events).toEqual([{ ids: [gone.id], source: "local" }]);
    stop();
  });
});

describe("sync queue (outbox)", () => {
  it("doesn't queue anything while not linked to an account", () => {
    const c = saveCharacter(makeStoredCharacter());
    deleteCharacter(c.id);
    expect(readSyncQueue()).toEqual({});
  });

  it("queues upserts and deletes once linked, with increasing seq numbers", () => {
    setLinkedAccount("user-1");
    const a = saveCharacter(makeStoredCharacter());
    const b = saveCharacter(makeStoredCharacter());
    deleteCharacter(b.id);

    const queue = readSyncQueue();
    expect(queue[a.id]).toMatchObject({ op: "upsert" });
    expect(queue[b.id]).toMatchObject({ op: "delete", deletedAt: expect.any(String) });
    expect(queue[b.id].seq).toBeGreaterThan(queue[a.id].seq);
  });

  it("completeSyncOp removes an entry only if it wasn't overwritten meanwhile", () => {
    setLinkedAccount("user-1");
    const c = saveCharacter(makeStoredCharacter());
    const firstSeq = readSyncQueue()[c.id].seq;

    saveCharacter({ ...c, name: "Edited while uploading" });
    completeSyncOp(c.id, firstSeq);
    expect(readSyncQueue()[c.id]).toBeDefined();

    completeSyncOp(c.id, readSyncQueue()[c.id].seq);
    expect(readSyncQueue()).toEqual({});
  });

  it("claimLocalCharactersForAccount links the device and queues every local character", () => {
    const a = saveCharacter(makeStoredCharacter());
    const b = saveCharacter(makeStoredCharacter());

    claimLocalCharactersForAccount("user-1");
    expect(getLinkedAccount()).toBe("user-1");
    expect(Object.keys(readSyncQueue()).sort()).toEqual([a.id, b.id].sort());
  });

  it("claiming keeps an already-queued delete instead of overwriting it", () => {
    setLinkedAccount("user-1");
    const c = saveCharacter(makeStoredCharacter());
    deleteCharacter(c.id);
    claimLocalCharactersForAccount("user-1");
    expect(readSyncQueue()[c.id].op).toBe("delete");
  });

  it("ignores a corrupt queue", () => {
    window.localStorage.setItem("character-sheet:sync-queue:v1", "[]");
    expect(readSyncQueue()).toEqual({});
  });
});

describe("applyRemoteChanges", () => {
  it("writes server copies without re-queueing or re-stamping them", async () => {
    setLinkedAccount("user-1");
    const local = saveCharacter(makeStoredCharacter({ name: "Local" }));
    completeSyncOp(local.id, readSyncQueue()[local.id].seq);

    const fromServer: StoredCharacter = makeStoredCharacter({ name: "From server", updatedAt: "2026-05-05T05:05:05.000Z" });
    await flushMicrotasks();
    const { events, stop } = captureChanges();
    applyRemoteChanges([fromServer], [local.id]);

    expect(loadCharacters()).toEqual([fromServer]);
    expect(readSyncQueue()).toEqual({});
    await flushMicrotasks();
    expect(events).toEqual([{ ids: [fromServer.id, local.id], source: "remote" }]);
    stop();
  });

  it("is a no-op (no event) with nothing to apply", async () => {
    const { events, stop } = captureChanges();
    applyRemoteChanges([], []);
    await flushMicrotasks();
    expect(events).toEqual([]);
    stop();
  });
});

describe("clearLocalCharacters", () => {
  it("wipes characters, the outbox and the account link", () => {
    setLinkedAccount("user-1");
    saveCharacter(makeStoredCharacter());
    clearLocalCharacters();
    expect(loadCharacters()).toEqual([]);
    expect(readSyncQueue()).toEqual({});
    expect(getLinkedAccount()).toBeNull();
  });
});
