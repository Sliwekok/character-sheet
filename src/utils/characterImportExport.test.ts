// @vitest-environment jsdom
import { afterEach, describe, it, expect, vi } from "vitest";
import type { StoredCharacter } from "@/interfaces/StoredCharacter";
import {
  characterToJson,
  downloadCharacterAsJson,
  exportFilename,
  parseImportedCharacter,
  readFileAsText,
} from "@/utils/characterImportExport";
import { Wizard as Wizard2014 } from "@/data/2014/classes/Wizard";
import { classLevel, makeStoredCharacter, weapon } from "../../tests/fixtures/characters";
import { compendiumSpell } from "../../tests/fixtures/spells";

afterEach(() => {
  vi.useRealTimers();
});

/** A stored character serialised, tweaked as a plain object, and turned back into JSON text. */
function jsonWith(mutate: (data: Record<string, unknown>) => void, base: StoredCharacter = makeStoredCharacter()): string {
  const data = JSON.parse(characterToJson(base)) as Record<string, unknown>;
  mutate(data);
  return JSON.stringify(data);
}

/** Spies on URL.createObjectURL/revokeObjectURL (defining them first if this environment lacks them). */
function stubObjectUrls(url: string) {
  for (const name of ["createObjectURL", "revokeObjectURL"] as const) {
    if (typeof URL[name] !== "function") Object.defineProperty(URL, name, { value: () => "", configurable: true, writable: true });
  }
  return {
    createObjectURL: vi.spyOn(URL, "createObjectURL").mockReturnValue(url),
    revokeObjectURL: vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined),
  };
}

function expectError(raw: string, message: string | RegExp) {
  const result = parseImportedCharacter(raw);
  expect("error" in result ? result.error : "(imported successfully)").toMatch(message);
}

describe("exportFilename", () => {
  it("slugifies the character's name", () => {
    expect(exportFilename(makeStoredCharacter({ name: "Aria Nightshade" }))).toBe("aria-nightshade.json");
    expect(exportFilename(makeStoredCharacter({ name: "  Sir Reginald III, the Bold!  " }))).toBe("sir-reginald-iii-the-bold.json");
  });

  it("falls back to 'character' when nothing usable is left", () => {
    expect(exportFilename(makeStoredCharacter({ name: "!!!" }))).toBe("character.json");
    expect(exportFilename(makeStoredCharacter({ name: "Ælfwynn" }))).toBe("lfwynn.json");
  });
});

describe("characterToJson", () => {
  it("produces pretty-printed JSON of the whole character", () => {
    const character = makeStoredCharacter();
    const json = characterToJson(character);
    expect(json).toContain('\n  "name": ');
    expect(JSON.parse(json)).toEqual(JSON.parse(JSON.stringify(character)));
  });
});

describe("parseImportedCharacter", () => {
  describe("round trip", () => {
    it("imports an exported character with nothing lost except a fresh id and updatedAt", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-01-02T03:04:05.000Z"));
      const original = makeStoredCharacter({
        edition: "2014",
        name: "Round Trip",
        classes: [classLevel(Wizard2014, 3)],
        weapons: [weapon("Dagger"), weapon("Quarterstaff", { bonus: 1 })],
        spellsKnown: [compendiumSpell("Fire Bolt"), compendiumSpell("Magic Missile")],
        featureChoices: { "0:Arcane Tradition:x": "y" },
        details: { inspiration: true, deathSaves: { successes: 1, failures: 2 } },
        createdAt: "2025-05-05T12:00:00.000Z",
      });

      const result = parseImportedCharacter(characterToJson(original));
      if ("error" in result) throw new Error(result.error);
      const { id, updatedAt, ...rest } = result.character;
      const { id: originalId, updatedAt: _originalUpdated, ...originalRest } = original;

      expect(id).not.toBe(originalId);
      expect(id).toBeTruthy();
      expect(updatedAt).toBe("2026-01-02T03:04:05.000Z");
      expect(rest.createdAt).toBe("2025-05-05T12:00:00.000Z");
      expect(rest).toEqual(JSON.parse(JSON.stringify(originalRest)));
    });

    it("gives every import a new id, even of the same file", () => {
      const json = characterToJson(makeStoredCharacter());
      const first = parseImportedCharacter(json);
      const second = parseImportedCharacter(json);
      expect("character" in first && "character" in second).toBe(true);
      if ("character" in first && "character" in second) expect(first.character.id).not.toBe(second.character.id);
    });

    it("replaces a missing or garbage createdAt with now", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-03-03T00:00:00.000Z"));
      for (const createdAt of ["not a date", undefined, 12345]) {
        const result = parseImportedCharacter(jsonWith((data) => void (data.createdAt = createdAt)));
        expect("character" in result && result.character.createdAt).toBe("2026-03-03T00:00:00.000Z");
      }
    });

    it("accepts a plain Character export without id/timestamps", () => {
      const result = parseImportedCharacter(
        jsonWith((data) => {
          delete data.id;
          delete data.createdAt;
          delete data.updatedAt;
        })
      );
      expect("character" in result).toBe(true);
    });
  });

  describe("rejection of files that aren't character exports", () => {
    it("rejects text that isn't JSON", () => {
      expectError("{ nope", "That file isn't valid JSON.");
      expectError("", "That file isn't valid JSON.");
    });

    it("rejects JSON that isn't an object", () => {
      expectError("null", /expected a JSON object/);
      expectError("42", /expected a JSON object/);
      expectError('"Aria"', /expected a JSON object/);
    });

    it("rejects an empty object or array", () => {
      expectError("{}", "Missing character name.");
      expectError("[]", "Missing character name.");
    });

    it("rejects another app's save file", () => {
      expectError(JSON.stringify({ name: "My Save", version: 3, level: 12, items: [] }), "Missing or unrecognized edition.");
    });

    it("rejects a D&D Beyond payload (it has to go through the D&D Beyond importer)", () => {
      expectError(JSON.stringify({ id: 161349291, name: "Ddb Hero", stats: [], classes: [{ level: 3, definition: { name: "Wizard" } }] }), /edition/);
    });
  });

  describe("field-by-field validation", () => {
    it.each<[string, (data: Record<string, unknown>) => void, string]>([
      ["a blank name", (d) => void (d.name = "   "), "Missing character name."],
      ["an unknown edition", (d) => void (d.edition = "2019"), "Missing or unrecognized edition."],
      ["a missing alignment", (d) => void (d.alignment = ""), "Missing alignment."],
      ["a race without a name", (d) => void (d.race = { name: "" }), "Missing race."],
      ["a missing background", (d) => void delete d.background, "Missing background."],
      ["no classes", (d) => void (d.classes = []), "Missing class."],
      ["classes that aren't a list", (d) => void (d.classes = { class: { name: "Fighter" }, level: 1 }), "Missing class."],
      [
        "a class without a level",
        (d) => void (d.classes = [{ class: { name: "Fighter" } }]),
        "One of the character's classes is missing its name or level.",
      ],
      [
        "a class without a name",
        (d) => void (d.classes = [{ class: {}, level: 1 }]),
        "One of the character's classes is missing its name or level.",
      ],
      ["a non-numeric ability score", (d) => void ((d.abilityScores as Record<string, unknown>).wisdom = "12"), "Missing or invalid ability scores."],
      ["a missing ability score", (d) => void delete (d.abilityScores as Record<string, unknown>).charisma, "Missing or invalid ability scores."],
      ["missing feats", (d) => void delete d.feats, "Missing feats list."],
      ["missing skill proficiencies", (d) => void (d.skillProficiencies = "Athletics"), "Missing skill proficiencies."],
      ["missing saving throws", (d) => void delete d.savingThrowProficiencies, "Missing saving throw proficiencies."],
      ["missing weapons", (d) => void delete d.weapons, "Missing weapons list."],
      ["missing currency", (d) => void (d.currency = null), "Missing currency."],
      ["missing spells", (d) => void delete d.spellsKnown, "Missing spells list."],
      ["missing languages", (d) => void delete d.languages, "Missing languages list."],
      ["missing current HP", (d) => void delete d.currentHP, "Missing hit points."],
      ["a non-numeric max HP", (d) => void (d.maxHP = "10"), "Missing hit points."],
      ["missing initiative", (d) => void delete d.initiative, "Missing initiative."],
    ])("rejects %s", (_description, mutate, message) => {
      expectError(jsonWith(mutate), message);
    });

    it("accepts both editions", () => {
      expect("character" in parseImportedCharacter(characterToJson(makeStoredCharacter({ edition: "2014" })))).toBe(true);
      expect("character" in parseImportedCharacter(characterToJson(makeStoredCharacter({ edition: "2024" })))).toBe(true);
    });
  });
});

describe("downloadCharacterAsJson", () => {
  it("clicks a temporary download link named after the character, then cleans up", () => {
    const { createObjectURL, revokeObjectURL } = stubObjectUrls("blob:fake-url");
    const clicked: HTMLAnchorElement[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      clicked.push(this);
    });

    const character = makeStoredCharacter({ name: "Aria Nightshade" });
    downloadCharacterAsJson(character);

    expect(clicked).toHaveLength(1);
    expect(clicked[0].download).toBe("aria-nightshade.json");
    expect(clicked[0].href).toBe("blob:fake-url");
    expect(document.body.contains(clicked[0])).toBe(false);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:fake-url");

    const blob = createObjectURL.mock.calls[0][0] as Blob;
    expect(blob.type).toBe("application/json");
  });

  it("still revokes the object URL if the click throws", () => {
    const { revokeObjectURL } = stubObjectUrls("blob:x");
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(() => downloadCharacterAsJson(makeStoredCharacter())).toThrow("blocked");
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:x");
  });
});

describe("readFileAsText", () => {
  it("resolves with the file's text, which can then be imported", async () => {
    const character = makeStoredCharacter({ name: "From Disk" });
    const file = new File([characterToJson(character)], "from-disk.json", { type: "application/json" });
    const text = await readFileAsText(file);
    const result = parseImportedCharacter(text);
    expect("character" in result && result.character.name).toBe("From Disk");
  });
});
