import { beforeEach, describe, expect, it } from "vitest";
import type { Campaign, CampaignInvite, SharedCampaignCharacters, SharedCharacterView } from "@/interfaces/Campaign";
import type { StoredCharacter } from "@/interfaces/StoredCharacter";
import { makeStoredCharacter } from "../fixtures/characters";
import { call, createBrowser, registerUser } from "./helpers/api";
import type { FakeBrowser } from "./helpers/requestContext";

type Player = { browser: FakeBrowser; id: string; displayName: string };

async function player(): Promise<Player> {
  const browser = createBrowser();
  const user = await registerUser(browser);
  return { browser, id: user.id, displayName: user.displayName };
}

async function createCampaign(owner: Player, name = "Lost Mine of Phandelver"): Promise<Campaign> {
  const result = await call<{ campaign: Campaign }>("/api/campaigns", { browser: owner.browser, body: { name } });
  expect(result.status).toBe(201);
  return result.body.campaign;
}

async function join(p: Player, code: string) {
  return call<{ campaign: Campaign }>(`/api/invites/${code}`, { browser: p.browser, method: "POST" });
}

function character(overrides: Partial<StoredCharacter> = {}): StoredCharacter {
  return makeStoredCharacter({ updatedAt: new Date().toISOString(), ...overrides });
}

async function save(p: Player, c: StoredCharacter) {
  const result = await call(`/api/characters/${c.id}`, { browser: p.browser, method: "PUT", body: { character: c } });
  expect(result.status).toBe(200);
  return c;
}

async function sharedList(p: Player) {
  return (await call<{ campaigns: SharedCampaignCharacters[] }>("/api/shared", { browser: p.browser })).body.campaigns;
}

function view(ownerId: string, characterId: string, browser?: FakeBrowser) {
  return call<SharedCharacterView>(`/api/shared/${ownerId}/${characterId}`, { browser });
}

let gm: Player;
let alice: Player;
let bob: Player;

beforeEach(async () => {
  gm = await player();
  alice = await player();
  bob = await player();
});

describe("campaigns", () => {
  it.each([
    ["GET", "/api/campaigns"],
    ["POST", "/api/campaigns"],
    ["GET", "/api/shared"],
  ] as const)("%s %s requires a signed-in user", async (method, path) => {
    const result = await call(path, { method, body: method === "POST" ? { name: "x" } : undefined });
    expect(result.status).toBe(401);
  });

  it("creates a campaign owned by its creator, with an invite code only the owner sees", async () => {
    const campaign = await createCampaign(gm);
    expect(campaign).toMatchObject({ name: "Lost Mine of Phandelver", isOwner: true, owner: { id: gm.id } });
    expect(campaign.members.map((m) => m.id)).toEqual([gm.id]);
    expect(campaign.inviteCode).toMatch(/^[A-Za-z0-9_-]{16,}$/);

    await join(alice, campaign.inviteCode!);
    const seenByAlice = (await call<{ campaign: Campaign }>(`/api/campaigns/${campaign.id}`, { browser: alice.browser })).body.campaign;
    expect(seenByAlice.isOwner).toBe(false);
    expect(seenByAlice.inviteCode).toBeNull();
  });

  it("validates the name", async () => {
    const result = await call("/api/campaigns", { browser: gm.browser, body: { name: "   " } });
    expect(result.status).toBe(400);
  });

  it("hides a campaign from non-members", async () => {
    const campaign = await createCampaign(gm);
    const result = await call(`/api/campaigns/${campaign.id}`, { browser: bob.browser });
    expect(result.status).toBe(404);
    expect((await call<{ campaigns: Campaign[] }>("/api/campaigns", { browser: bob.browser })).body.campaigns).toEqual([]);
  });

  it("previews an invite signed out, but joining needs an account", async () => {
    const campaign = await createCampaign(gm);
    const preview = await call<{ invite: CampaignInvite }>(`/api/invites/${campaign.inviteCode}`);
    expect(preview.status).toBe(200);
    expect(preview.body.invite).toMatchObject({ campaignId: campaign.id, name: campaign.name, memberCount: 1, isMember: false });

    const anonymousJoin = await call(`/api/invites/${campaign.inviteCode}`, { method: "POST" });
    expect(anonymousJoin.status).toBe(401);
  });

  it("joins through the invite link (idempotently)", async () => {
    const campaign = await createCampaign(gm);
    expect((await join(alice, campaign.inviteCode!)).status).toBe(200);
    expect((await join(alice, campaign.inviteCode!)).status).toBe(200);

    const members = (await call<{ campaign: Campaign }>(`/api/campaigns/${campaign.id}`, { browser: gm.browser })).body.campaign.members;
    expect(members.map((m) => m.id)).toEqual([gm.id, alice.id]);

    const preview = await call<{ invite: CampaignInvite }>(`/api/invites/${campaign.inviteCode}`, { browser: alice.browser });
    expect(preview.body.invite.isMember).toBe(true);
  });

  it("rejects unknown invite codes", async () => {
    expect((await call("/api/invites/not-a-real-invite-code-123")).status).toBe(404);
    expect((await join(alice, "not-a-real-invite-code-123")).status).toBe(404);
  });

  it("regenerating the invite revokes the old link (owner only)", async () => {
    const campaign = await createCampaign(gm);
    await join(alice, campaign.inviteCode!);
    expect((await call(`/api/campaigns/${campaign.id}/invite`, { browser: alice.browser, method: "POST" })).status).toBe(403);

    const renewed = (await call<{ campaign: Campaign }>(`/api/campaigns/${campaign.id}/invite`, { browser: gm.browser, method: "POST" })).body
      .campaign;
    expect(renewed.inviteCode).not.toBe(campaign.inviteCode);
    expect((await join(bob, campaign.inviteCode!)).status).toBe(404);
    expect((await join(bob, renewed.inviteCode!)).status).toBe(200);
  });

  it("only the owner renames or deletes", async () => {
    const campaign = await createCampaign(gm);
    await join(alice, campaign.inviteCode!);
    expect((await call(`/api/campaigns/${campaign.id}`, { browser: alice.browser, method: "PUT", body: { name: "Mine" } })).status).toBe(403);
    expect((await call(`/api/campaigns/${campaign.id}`, { browser: alice.browser, method: "DELETE" })).status).toBe(403);

    const renamed = await call<{ campaign: Campaign }>(`/api/campaigns/${campaign.id}`, {
      browser: gm.browser,
      method: "PUT",
      body: { name: "Storm King's Thunder", description: "Giants!" },
    });
    expect(renamed.body.campaign).toMatchObject({ name: "Storm King's Thunder", description: "Giants!" });
  });

  it("members can leave, the owner can remove players, the owner can't leave", async () => {
    const campaign = await createCampaign(gm);
    await join(alice, campaign.inviteCode!);
    await join(bob, campaign.inviteCode!);

    expect((await call(`/api/campaigns/${campaign.id}/members/${bob.id}`, { browser: alice.browser, method: "DELETE" })).status).toBe(403);
    expect((await call(`/api/campaigns/${campaign.id}/members/${gm.id}`, { browser: gm.browser, method: "DELETE" })).status).toBe(400);

    expect((await call(`/api/campaigns/${campaign.id}/members/${alice.id}`, { browser: alice.browser, method: "DELETE" })).status).toBe(200);
    expect((await call(`/api/campaigns/${campaign.id}/members/${bob.id}`, { browser: gm.browser, method: "DELETE" })).status).toBe(200);

    const members = (await call<{ campaign: Campaign }>(`/api/campaigns/${campaign.id}`, { browser: gm.browser })).body.campaign.members;
    expect(members.map((m) => m.id)).toEqual([gm.id]);
    expect((await call(`/api/campaigns/${campaign.id}`, { browser: alice.browser })).status).toBe(404);
  });
});

describe("sharing characters", () => {
  let campaign: Campaign;

  beforeEach(async () => {
    campaign = await createCampaign(gm);
    await join(alice, campaign.inviteCode!);
    await join(bob, campaign.inviteCode!);
  });

  it("lists other members' shared characters under the campaign - never private ones or your own", async () => {
    const shared = await save(bob, character({ name: "Brakka", visibility: "shared", campaignId: campaign.id }));
    await save(bob, character({ name: "Secret alt" })); // no visibility = private
    await save(alice, character({ name: "Mine", visibility: "shared", campaignId: campaign.id }));

    const groups = await sharedList(alice);
    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({ campaignId: campaign.id, campaignName: campaign.name });
    expect(groups[0].characters.map((entry) => entry.character.name)).toEqual(["Brakka"]);
    expect(groups[0].characters[0].owner).toEqual({ id: bob.id, displayName: bob.displayName });
    expect(groups[0].characters[0].character.id).toBe(shared.id);
  });

  it("lists public characters picked for the campaign too", async () => {
    await save(bob, character({ name: "Town crier", visibility: "public", campaignId: campaign.id }));
    expect((await sharedList(gm))[0].characters.map((e) => e.character.name)).toEqual(["Town crier"]);
  });

  it("ignores a campaign the character's owner isn't a member of", async () => {
    const outsider = await player();
    await save(outsider, character({ name: "Gatecrasher", visibility: "shared", campaignId: campaign.id }));
    expect((await sharedList(alice))[0].characters).toEqual([]);
  });

  it("opens a shared character read-only for fellow members only", async () => {
    const c = await save(bob, character({ name: "Brakka", visibility: "shared", campaignId: campaign.id }));

    const asAlice = await view(bob.id, c.id, alice.browser);
    expect(asAlice.status).toBe(200);
    expect(asAlice.body).toMatchObject({
      isOwner: false,
      owner: { id: bob.id },
      campaign: { id: campaign.id, name: campaign.name },
      character: { id: c.id, name: "Brakka" },
    });

    const outsider = await player();
    expect((await view(bob.id, c.id, outsider.browser)).status).toBe(404);
    expect((await view(bob.id, c.id)).status).toBe(404); // signed out
  });

  it("opens a public character for anyone, without revealing the campaign to outsiders", async () => {
    const c = await save(bob, character({ visibility: "public", campaignId: campaign.id }));
    const anonymous = await view(bob.id, c.id);
    expect(anonymous.status).toBe(200);
    expect(anonymous.body.campaign).toBeNull();
    expect((await view(bob.id, c.id, alice.browser)).body.campaign).toMatchObject({ id: campaign.id });
  });

  it("never exposes a private character - except to its owner", async () => {
    const c = await save(bob, character({ visibility: "private", campaignId: campaign.id }));
    expect((await view(bob.id, c.id, alice.browser)).status).toBe(404);
    expect((await view(bob.id, c.id)).status).toBe(404);
    const own = await view(bob.id, c.id, bob.browser);
    expect(own.status).toBe(200);
    expect(own.body.isOwner).toBe(true);
  });

  it("stops sharing when the character goes private or is deleted", async () => {
    const c = await save(bob, character({ visibility: "shared", campaignId: campaign.id }));
    await save(bob, { ...c, visibility: "private", updatedAt: new Date(Date.now() + 1000).toISOString() });
    expect((await view(bob.id, c.id, alice.browser)).status).toBe(404);

    const d = await save(bob, character({ visibility: "shared", campaignId: campaign.id }));
    await call(`/api/characters/${d.id}`, { browser: bob.browser, method: "DELETE", body: { deletedAt: new Date(Date.now() + 1000).toISOString() } });
    expect((await view(bob.id, d.id, alice.browser)).status).toBe(404);
    expect((await sharedList(alice))[0].characters).toEqual([]);
  });

  it("a viewer can't change someone else's character - a PUT with its id only writes the viewer's own copy", async () => {
    const c = await save(bob, character({ name: "Brakka", visibility: "shared", campaignId: campaign.id }));
    await save(alice, { ...c, name: "Vandalized", updatedAt: new Date(Date.now() + 60_000).toISOString() });
    expect((await view(bob.id, c.id, alice.browser)).body.character.name).toBe("Brakka");
    expect((await view(bob.id, c.id, gm.browser)).body.character.name).toBe("Brakka");
  });

  it("leaving a campaign hides your characters from it and theirs from you", async () => {
    const c = await save(bob, character({ visibility: "shared", campaignId: campaign.id }));
    const a = await save(alice, character({ visibility: "shared", campaignId: campaign.id }));
    await call(`/api/campaigns/${campaign.id}/members/${bob.id}`, { browser: bob.browser, method: "DELETE" });

    expect((await view(bob.id, c.id, alice.browser)).status).toBe(404);
    expect((await view(alice.id, a.id, bob.browser)).status).toBe(404);
    expect((await sharedList(alice))[0].characters).toEqual([]);
    expect(await sharedList(bob)).toEqual([]);
  });

  it("deleting the campaign stops sharing through it", async () => {
    const c = await save(bob, character({ visibility: "shared", campaignId: campaign.id }));
    expect((await call(`/api/campaigns/${campaign.id}`, { browser: gm.browser, method: "DELETE" })).status).toBe(200);
    expect((await view(bob.id, c.id, alice.browser)).status).toBe(404);
    expect(await sharedList(alice)).toEqual([]);
  });

  it("rejects malformed ids with a 404", async () => {
    expect((await view("not-an-object-id", "abc", alice.browser)).status).toBe(404);
    expect((await call("/api/campaigns/not-an-id", { browser: alice.browser })).status).toBe(404);
  });
});
