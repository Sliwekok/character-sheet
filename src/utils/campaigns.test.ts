import { describe, expect, it } from "vitest";
import { getCharacterSharing, isSharingComplete, sharingPatch } from "./campaigns";
import { draftFromCharacter } from "./characterDraft";
import { makeStoredCharacter } from "../../tests/fixtures/characters";

describe("character sharing helpers", () => {
  it("treats a character without sharing fields as private", () => {
    expect(getCharacterSharing({})).toEqual({ visibility: "private", campaignId: null });
    expect(getCharacterSharing({ visibility: "bogus" as never, campaignId: "x" })).toEqual({ visibility: "private", campaignId: null });
  });

  it("drops the campaign when going private", () => {
    expect(sharingPatch({ visibility: "private", campaignId: "abc" })).toEqual({ visibility: "private", campaignId: null });
    expect(sharingPatch({ visibility: "public", campaignId: "abc" })).toEqual({ visibility: "public", campaignId: "abc" });
  });

  it("requires a campaign only for 'shared'", () => {
    expect(isSharingComplete({ visibility: "shared", campaignId: null })).toBe(false);
    expect(isSharingComplete({ visibility: "shared", campaignId: "abc" })).toBe(true);
    expect(isSharingComplete({ visibility: "public", campaignId: null })).toBe(true);
    expect(isSharingComplete({ visibility: "private", campaignId: null })).toBe(true);
  });

  it("carries sharing settings into the edit wizard's draft", () => {
    const character = makeStoredCharacter({ visibility: "shared", campaignId: "0123456789abcdef01234567" });
    expect(draftFromCharacter(character)).toMatchObject({ visibility: "shared", campaignId: "0123456789abcdef01234567" });
    expect(getCharacterSharing(draftFromCharacter(makeStoredCharacter()))).toEqual({ visibility: "private", campaignId: null });
  });
});
