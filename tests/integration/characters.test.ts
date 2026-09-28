import { beforeEach, describe, expect, it } from "vitest";
import type { RemoteCharacter } from "@/interfaces/Sync";
import type { StoredCharacter } from "@/interfaces/StoredCharacter";
import { collections } from "@/server/db";
import { makeStoredCharacter } from "../fixtures/characters";
import { call, createBrowser, registerUser, signIn } from "./helpers/api";
import type { FakeBrowser } from "./helpers/requestContext";

type PutBody = { applied: boolean; character: RemoteCharacter };
type DeleteBody = { applied: boolean; character: RemoteCharacter | null };

const iso = (msFromNow: number) => new Date(Date.now() + msFromNow).toISOString();

function character(overrides: Partial<StoredCharacter> = {}): StoredCharacter {
  return makeStoredCharacter({ updatedAt: iso(0), ...overrides });
}

function put(browser: FakeBrowser, c: StoredCharacter) {
  return call<PutBody>(`/api/characters/${c.id}`, { browser, method: "PUT", body: { character: c } });
}

function remove(browser: FakeBrowser, id: string, deletedAt?: string) {
  return call<DeleteBody>(`/api/characters/${id}`, { browser, method: "DELETE", body: deletedAt ? { deletedAt } : undefined });
}

async function list(browser: FakeBrowser) {
  return (await call<{ characters: RemoteCharacter[] }>("/api/characters", { browser })).body.characters;
}

let browser: FakeBrowser;
let email: string;

beforeEach(async () => {
  browser = createBrowser();
  email = (await registerUser(browser)).email;
});

describe("authentication", () => {
  it.each([
    ["GET", "/api/characters"],
    ["GET", "/api/characters/abc"],
    ["PUT", "/api/characters/abc"],
    ["DELETE", "/api/characters/abc"],
  ] as const)("%s %s requires a signed-in user", async (method, path) => {
    const result = await call(path, { method, body: method === "PUT" ? { character: character({ id: "abc" }) } : undefined });
    expect(result.status).toBe(401);
  });

  it("rejects cross-origin writes", async () => {
    const c = character();
    const result = await call(`/api/characters/${c.id}`, {
      browser,
      method: "PUT",
      body: { character: c },
      headers: { origin: "https://evil.example" },
    });
    expect(result.status).toBe(403);
  });
});

describe("PUT /api/characters/:id", () => {
  it("stores a new character and returns it as a RemoteCharacter", async () => {
    const c = character({ name: "Bilbo" });
    const result = await put(browser, c);

    expect(result.status).toBe(200);
    expect(result.body.applied).toBe(true);
    expect(result.body.character).toEqual({ id: c.id, updatedAt: c.updatedAt, deletedAt: null, character: c });

    const { characters } = await collections();
    const doc = await characters.findOne({ characterId: c.id });
    expect(doc?.name).toBe("Bilbo");
    expect(typeof doc?.data).toBe("string");
  });

  it("round-trips map keys MongoDB wouldn't allow as field names", async () => {
    const c = character({ featureChoices: { "Fighter.1.Fighting Style": "Defense", $weird: "yes" } });
    await put(browser, c);
    const result = await call<{ character: RemoteCharacter }>(`/api/characters/${c.id}`, { browser });
    expect(result.body.character.character?.featureChoices).toEqual(c.featureChoices);
  });

  it("keeps the newer version when an older edit arrives (last write wins)", async () => {
    const newer = character({ name: "Newer", updatedAt: iso(0) });
    await put(browser, newer);
    const stale = { ...newer, name: "Stale", updatedAt: iso(-60_000) };

    const result = await put(browser, stale);
    expect(result.body.applied).toBe(false);
    expect(result.body.character.character?.name).toBe("Newer");
  });

  it("accepts an edit with exactly the same timestamp", async () => {
    const c = character({ name: "First" });
    await put(browser, c);
    const result = await put(browser, { ...c, name: "Second" });
    expect(result.body.applied).toBe(true);
    expect(result.body.character.character?.name).toBe("Second");
  });

  it.each([
    ["no character in the body", { nope: true }, 400, /Missing character data/],
    ["an id that doesn't match the URL", { character: { id: "other" } }, 400, /doesn't match/],
    ["a missing updatedAt", { character: { id: "url-id", createdAt: iso(0) } }, 400, /updatedAt/],
    ["an invalid createdAt", { character: { id: "url-id", updatedAt: iso(0), createdAt: "yesterday-ish" } }, 400, /createdAt/],
  ])("rejects %s", async (_label, body, status, message) => {
    const result = await call("/api/characters/url-id", { browser, method: "PUT", body });
    expect(result.status).toBe(status);
    expect(result.body.error).toMatch(message);
  });

  it("rejects an invalid character id in the URL", async () => {
    const result = await call("/api/characters/has%20space", { browser, method: "PUT", body: { character: {} } });
    expect(result.status).toBe(400);
    expect(result.body.error).toBe("Invalid character id.");
  });

  it("rejects characters over 2 MB with 413", async () => {
    const c = character({ details: { backstory: "x".repeat(2 * 1024 * 1024) } });
    const result = await put(browser, c);
    expect(result.status).toBe(413);
  });
});

describe("GET /api/characters and /api/characters/:id", () => {
  it("lists the user's characters, most recently updated first", async () => {
    const older = character({ name: "Older", updatedAt: iso(-10_000) });
    const newer = character({ name: "Newer", updatedAt: iso(0) });
    await put(browser, older);
    await put(browser, newer);

    const characters = await list(browser);
    expect(characters.map((c) => c.character?.name)).toEqual(["Newer", "Older"]);
  });

  it("returns 404 for a character this user never saved", async () => {
    const result = await call("/api/characters/never-saved", { browser });
    expect(result.status).toBe(404);
  });

  it("keeps every account's characters separate", async () => {
    const mine = character({ name: "Mine" });
    await put(browser, mine);

    const stranger = createBrowser();
    await registerUser(stranger);
    expect(await list(stranger)).toEqual([]);
    expect((await call(`/api/characters/${mine.id}`, { browser: stranger })).status).toBe(404);

    // The same client-generated id under another account is a different row, not an overwrite.
    await put(stranger, { ...mine, name: "Theirs" });
    expect((await list(browser))[0].character?.name).toBe("Mine");
  });

  it("is visible from another device signed in to the same account", async () => {
    const c = character({ name: "Shared" });
    await put(browser, c);
    const phone = await signIn(email);
    expect((await list(phone)).map((r) => r.id)).toEqual([c.id]);
  });
});

describe("DELETE /api/characters/:id", () => {
  it("leaves a tombstone that list() reports, so other devices learn about the delete", async () => {
    const c = character();
    await put(browser, c);

    const deletedAt = iso(1000);
    const result = await remove(browser, c.id, deletedAt);
    expect(result.body.applied).toBe(true);
    expect(result.body.character).toMatchObject({ id: c.id, deletedAt, character: null });

    expect(await list(browser)).toEqual([expect.objectContaining({ id: c.id, deletedAt, character: null })]);
  });

  it("works without a body (deletedAt defaults to now)", async () => {
    const c = character({ updatedAt: iso(-60_000) });
    await put(browser, c);
    const result = await remove(browser, c.id);
    expect(result.body.applied).toBe(true);
    expect(Date.parse(result.body.character!.deletedAt!)).toBeGreaterThan(Date.now() - 10_000);
  });

  it("clamps a deletedAt far in the future to now", async () => {
    const result = await remove(browser, "future-delete", iso(24 * 60 * 60 * 1000));
    expect(Date.parse(result.body.character!.deletedAt!)).toBeLessThanOrEqual(Date.now());
  });

  it("does not delete a character that was edited after the delete happened", async () => {
    const edited = character({ name: "Edited elsewhere", updatedAt: iso(0) });
    await put(browser, edited);

    const result = await remove(browser, edited.id, iso(-60_000));
    expect(result.body.applied).toBe(false);
    expect(result.body.character?.character?.name).toBe("Edited elsewhere");
  });

  it("won't let a stale device resurrect a deleted character", async () => {
    const c = character({ updatedAt: iso(-60_000) });
    await put(browser, c);
    await remove(browser, c.id, iso(0));

    const resurrect = await put(browser, { ...c, name: "Zombie", updatedAt: iso(-30_000) });
    expect(resurrect.body.applied).toBe(false);
    expect(resurrect.body.character.deletedAt).not.toBeNull();
  });

  it("accepts a re-creation newer than the delete", async () => {
    const c = character({ updatedAt: iso(-60_000) });
    await put(browser, c);
    await remove(browser, c.id, iso(-30_000));

    const revived = await put(browser, { ...c, name: "Back again", updatedAt: iso(0) });
    expect(revived.body.applied).toBe(true);
    expect(revived.body.character).toMatchObject({ deletedAt: null, character: { name: "Back again" } });
  });
});
