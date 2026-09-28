import { describe, it, expect } from "vitest";
import { parseCharacterId } from "@/utils/dndbeyond/characterId";

describe("parseCharacterId", () => {
  it("accepts a bare numeric id, ignoring surrounding whitespace", () => {
    expect(parseCharacterId("161349291")).toBe("161349291");
    expect(parseCharacterId("  161349291\n")).toBe("161349291");
  });

  it("pulls the id out of a character profile URL", () => {
    expect(parseCharacterId("https://www.dndbeyond.com/characters/161349291")).toBe("161349291");
    expect(parseCharacterId("https://www.dndbeyond.com/characters/161349291/AbCdEf")).toBe("161349291");
    expect(parseCharacterId("https://www.dndbeyond.com/characters/161349291?share=abc")).toBe("161349291");
    expect(parseCharacterId("dndbeyond.com/profile/someone/characters/42")).toBe("42");
  });

  it("returns undefined for anything else", () => {
    expect(parseCharacterId("")).toBeUndefined();
    expect(parseCharacterId("not an id")).toBeUndefined();
    expect(parseCharacterId("12a34")).toBeUndefined();
    expect(parseCharacterId("https://www.dndbeyond.com/campaigns/12345")).toBeUndefined();
  });
});
