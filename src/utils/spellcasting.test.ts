import { describe, it, expect } from "vitest";
import type { AbilityScores } from "@/interfaces/Characters";
import type { CharacterClass } from "@/interfaces/CharacterClass";
import type { Subclass } from "@/interfaces/Subclass";
import {
  getAvailableSpellLevels,
  getAvailableSpellLevelsForClasses,
  getEffectiveCasterLevel,
  getEffectiveCasterProgression,
  getPactMagicSlots,
  getSpellLimits,
  getSpellSlots,
  pruneSpellsToLimits,
  type SpellcasterEntry,
  type SpellLimits,
} from "@/utils/spellcasting";
import { Wizard as Wizard2014 } from "@/data/2014/classes/Wizard";
import { Sorcerer as Sorcerer2014 } from "@/data/2014/classes/Sorcerer";
import { Paladin as Paladin2014 } from "@/data/2014/classes/Paladin";
import { Ranger as Ranger2014 } from "@/data/2014/classes/Ranger";
import { Warlock as Warlock2014 } from "@/data/2014/classes/Warlock";
import { Fighter as Fighter2014 } from "@/data/2014/classes/Fighter";
import { Cleric as Cleric2014 } from "@/data/2014/classes/Cleric";
import { EldritchKnight as EldritchKnight2014 } from "@/data/2014/subclasses/EldritchKnight";
import { Wizard as Wizard2024 } from "@/data/2024/classes/Wizard";
import { Warlock as Warlock2024 } from "@/data/2024/classes/Warlock";
import { Paladin as Paladin2024 } from "@/data/2024/classes/Paladin";
import { Fighter as Fighter2024 } from "@/data/2024/classes/Fighter";
import { Rogue as Rogue2024 } from "@/data/2024/classes/Rogue";
import { EldritchKnight as EldritchKnight2024 } from "@/data/2024/subclasses/EldritchKnight";
import { RogueSubclasses as RogueSubclasses2024 } from "@/data/2024/subclasses/Rogue";
import { classLevel, makeCharacter } from "../../tests/fixtures/characters";
import { spellAt } from "../../tests/fixtures/spells";

const ArcaneTrickster2024 = RogueSubclasses2024.find((subclass) => subclass.name === "Arcane Trickster")!;

const scores = (overrides: Partial<AbilityScores> = {}): AbilityScores => ({
  strength: 10,
  dexterity: 10,
  constitution: 10,
  intelligence: 10,
  wisdom: 10,
  charisma: 10,
  ...overrides,
});

const entry = (characterClass: CharacterClass | undefined, level: number, subclass?: Subclass): SpellcasterEntry => ({
  characterClass,
  subclass,
  level,
});

/** A Character made of the given class levels (edition taken from the first class). */
function characterWith(...classes: ReturnType<typeof classLevel>[]) {
  return makeCharacter({ edition: classes[0].class.edition, classes });
}

describe("getEffectiveCasterProgression", () => {
  it("returns 'none' when no class has been picked yet", () => {
    expect(getEffectiveCasterProgression(undefined, undefined)).toBe("none");
  });

  it("uses the class's own progression when there is no subclass override", () => {
    expect(getEffectiveCasterProgression(Wizard2014, undefined)).toBe("full");
    expect(getEffectiveCasterProgression(Paladin2014, undefined)).toBe("half");
    expect(getEffectiveCasterProgression(Warlock2024, undefined)).toBe("pact");
    expect(getEffectiveCasterProgression(Fighter2024, undefined)).toBe("none");
  });

  it("lets Eldritch Knight / Arcane Trickster turn a non-caster base class into a third caster", () => {
    expect(getEffectiveCasterProgression(Fighter2014, EldritchKnight2014)).toBe("third");
    expect(getEffectiveCasterProgression(Rogue2024, ArcaneTrickster2024)).toBe("third");
  });
});

describe("getEffectiveCasterLevel (multiclass caster level)", () => {
  it("counts full-caster levels in full", () => {
    expect(getEffectiveCasterLevel([classLevel(Wizard2014, 7)])).toBe(7);
  });

  it("counts half-caster levels as half, rounded down", () => {
    expect(getEffectiveCasterLevel([classLevel(Paladin2014, 5)])).toBe(2);
    expect(getEffectiveCasterLevel([classLevel(Paladin2014, 1)])).toBe(0);
  });

  it("counts third-caster levels as a third, rounded down", () => {
    expect(getEffectiveCasterLevel([classLevel(Fighter2014, 8, { subclass: EldritchKnight2014 })])).toBe(2);
  });

  it("rounds each class down separately before summing (Paladin 3 + Ranger 3 = 1 + 1, not floor(6/2))", () => {
    expect(getEffectiveCasterLevel([classLevel(Paladin2014, 3), classLevel(Ranger2014, 3)])).toBe(2);
  });

  it("ignores Warlock levels and non-caster levels entirely", () => {
    expect(getEffectiveCasterLevel([classLevel(Warlock2014, 5), classLevel(Wizard2014, 2), classLevel(Fighter2014, 3)])).toBe(2);
  });

  it("is 0 for a character with no spellcasting at all", () => {
    expect(getEffectiveCasterLevel([classLevel(Fighter2024, 10)])).toBe(0);
  });
});

describe("getSpellSlots (shared slot pool)", () => {
  describe("single-class full casters", () => {
    it.each([
      [1, { 1: 2 }],
      [3, { 1: 4, 2: 2 }],
      [5, { 1: 4, 2: 3, 3: 2 }],
      [9, { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1 }],
      [17, { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1, 9: 1 }],
      [20, { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2, 7: 2, 8: 1, 9: 1 }],
    ])("a level %i Wizard has the PHB full-caster slots", (level, expected) => {
      expect(getSpellSlots(characterWith(classLevel(Wizard2014, level)))).toEqual(expected);
      expect(getSpellSlots(characterWith(classLevel(Wizard2024, level)))).toEqual(expected);
    });
  });

  describe("single-class half casters (2014)", () => {
    it("has no slots at Paladin level 1", () => {
      expect(getSpellSlots(characterWith(classLevel(Paladin2014, 1)))).toEqual({});
    });

    it.each([
      [2, { 1: 2 }],
      [5, { 1: 4, 2: 2 }],
      [9, { 1: 4, 2: 3, 3: 2 }],
      [13, { 1: 4, 2: 3, 3: 3, 4: 1 }],
      [17, { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1 }],
      [20, { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2 }],
    ])("a level %i Paladin uses the Paladin's own table, not the multiclass formula", (level, expected) => {
      expect(getSpellSlots(characterWith(classLevel(Paladin2014, level)))).toEqual(expected);
    });
  });

  describe("single-class third casters", () => {
    it("has no slots before Eldritch Knight level 3", () => {
      expect(getSpellSlots(characterWith(classLevel(Fighter2014, 2, { subclass: EldritchKnight2014 })))).toEqual({});
    });

    it.each([
      [3, { 1: 2 }],
      [4, { 1: 3 }],
      [7, { 1: 4, 2: 2 }],
      [11, { 1: 4, 2: 3 }],
    ])("a level %i Eldritch Knight uses the third-caster table", (level, expected) => {
      expect(getSpellSlots(characterWith(classLevel(Fighter2014, level, { subclass: EldritchKnight2014 })))).toEqual(expected);
      expect(getSpellSlots(characterWith(classLevel(Fighter2024, level, { subclass: EldritchKnight2024 })))).toEqual(expected);
    });

    it.todo(
      "BUG: third-caster table is wrong from level 10 up - PHB Eldritch Knight/Arcane Trickster: 10 = {1:4,2:3}, 13 = {1:4,2:3,3:2}, 16 = {1:4,2:3,3:3}, 19 = {1:4,2:3,3:3,4:1}"
    );
  });

  describe("multiclass casters combine into the full-caster table", () => {
    it("Paladin 2 + Sorcerer 3 = caster level 4", () => {
      const character = characterWith(classLevel(Paladin2014, 2), classLevel(Sorcerer2014, 3));
      expect(getSpellSlots(character)).toEqual({ 1: 4, 2: 3 });
    });

    it("Paladin 3 + Ranger 3 = caster level 2 (each rounded down first)", () => {
      const character = characterWith(classLevel(Paladin2014, 3), classLevel(Ranger2014, 3));
      expect(getSpellSlots(character)).toEqual({ 1: 3 });
    });

    it("Eldritch Knight 7 + Wizard 1 = caster level 3", () => {
      const character = characterWith(classLevel(Fighter2014, 7, { subclass: EldritchKnight2014 }), classLevel(Wizard2014, 1));
      expect(getSpellSlots(character)).toEqual({ 1: 4, 2: 2 });
    });

    it("Cleric 10 + Wizard 10 = caster level 20", () => {
      const character = characterWith(classLevel(Cleric2014, 10), classLevel(Wizard2014, 10));
      expect(getSpellSlots(character)).toEqual({ 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2, 7: 2, 8: 1, 9: 1 });
    });

    it("returns null when every caster class contributes 0 (Paladin 1 + Ranger 1)", () => {
      const character = characterWith(classLevel(Paladin2014, 1), classLevel(Ranger2014, 1));
      expect(getSpellSlots(character)).toBeNull();
    });

    it("a non-caster class alongside a single caster leaves the caster on its own solo table", () => {
      // Paladin 9 alone has 3rd-level slots; if it were run through the
      // multiclass formula (caster level 4) it would not.
      const character = characterWith(classLevel(Paladin2014, 9), classLevel(Fighter2014, 2));
      expect(getSpellSlots(character)).toEqual({ 1: 4, 2: 3, 3: 2 });
    });
  });

  it("returns null for a pure non-caster", () => {
    expect(getSpellSlots(makeCharacter())).toBeNull();
  });

  it("returns null for a pure Warlock (Pact Magic is a separate pool)", () => {
    expect(getSpellSlots(characterWith(classLevel(Warlock2014, 5)))).toBeNull();
  });

  it("does not add Warlock levels to a multiclass shared pool", () => {
    const character = characterWith(classLevel(Warlock2014, 5), classLevel(Wizard2014, 3));
    expect(getSpellSlots(character)).toEqual({ 1: 4, 2: 2 });
  });

  describe("2024 rules", () => {
    it.todo("BUG: a level 1 Paladin/Ranger (2024) should have two 1st-level slots, but getSpellSlots returns {}");
    it.todo(
      "BUG: 2024 multiclassing rounds Paladin/Ranger levels UP (Paladin 3 + Wizard 1 = caster level 3, {1:4,2:2}), but the code always rounds down (caster level 2, {1:3})"
    );

    it("2024 full casters use the same table as 2014", () => {
      expect(getSpellSlots(characterWith(classLevel(Wizard2024, 5)))).toEqual({ 1: 4, 2: 3, 3: 2 });
    });

    it("a 2024 Paladin 5 has the half-caster slots", () => {
      expect(getSpellSlots(characterWith(classLevel(Paladin2024, 5)))).toEqual({ 1: 4, 2: 2 });
    });
  });
});

describe("getPactMagicSlots", () => {
  it.each([
    [1, { 1: 1 }],
    [2, { 1: 2 }],
    [3, { 2: 2 }],
    [5, { 3: 2 }],
    [7, { 4: 2 }],
    [9, { 5: 2 }],
    [11, { 5: 3 }],
    [17, { 5: 4 }],
    [20, { 5: 4 }],
  ])("a level %i Warlock has the PHB Pact Magic slots in both editions", (level, expected) => {
    expect(getPactMagicSlots(characterWith(classLevel(Warlock2014, level)))).toEqual(expected);
    expect(getPactMagicSlots(characterWith(classLevel(Warlock2024, level)))).toEqual(expected);
  });

  it("depends only on Warlock level when multiclassed", () => {
    const character = characterWith(classLevel(Wizard2014, 10), classLevel(Warlock2014, 3));
    expect(getPactMagicSlots(character)).toEqual({ 2: 2 });
    expect(getSpellSlots(character)).toEqual({ 1: 4, 2: 3, 3: 3, 4: 3, 5: 2 });
  });

  it("returns null for a character with no Warlock levels", () => {
    expect(getPactMagicSlots(characterWith(classLevel(Wizard2014, 5)))).toBeNull();
    expect(getPactMagicSlots(makeCharacter())).toBeNull();
  });
});

describe("getAvailableSpellLevelsForClasses", () => {
  it("offers cantrips plus every slot level a full caster has", () => {
    expect(getAvailableSpellLevelsForClasses([entry(Wizard2014, 5)])).toEqual([0, 1, 2, 3]);
    expect(getAvailableSpellLevelsForClasses([entry(Wizard2024, 1)])).toEqual([0, 1]);
  });

  it("offers cantrips and every level up to a Warlock's pact slot level", () => {
    expect(getAvailableSpellLevelsForClasses([entry(Warlock2024, 1)])).toEqual([0, 1]);
    expect(getAvailableSpellLevelsForClasses([entry(Warlock2014, 5)])).toEqual([0, 1, 2, 3]);
  });

  it("does not offer cantrips to half casters", () => {
    expect(getAvailableSpellLevelsForClasses([entry(Paladin2014, 5)])).toEqual([1, 2]);
  });

  it("offers nothing to a level 1 (2014) Paladin with no slots yet", () => {
    expect(getAvailableSpellLevelsForClasses([entry(Paladin2014, 1)])).toEqual([]);
  });

  it("takes the higher of the shared and pact pools when multiclassed", () => {
    // Wizard 1 alone only reaches 1st level; Warlock 5's pact slots are 3rd level.
    expect(getAvailableSpellLevelsForClasses([entry(Wizard2014, 1), entry(Warlock2014, 5)])).toEqual([0, 1, 2, 3]);
  });

  it("returns nothing for non-casters or for a draft row with no class picked", () => {
    expect(getAvailableSpellLevelsForClasses([entry(Fighter2024, 5)])).toEqual([]);
    expect(getAvailableSpellLevelsForClasses([entry(undefined, 5)])).toEqual([]);
    expect(getAvailableSpellLevelsForClasses([])).toEqual([]);
  });

  it("offers a 3rd-level Eldritch Knight 1st-level spells", () => {
    expect(getAvailableSpellLevelsForClasses([entry(Fighter2014, 3, EldritchKnight2014)])).toContain(1);
  });

  it.todo("BUG: Eldritch Knights and Arcane Tricksters know cantrips (RAW, both editions) but level 0 is never offered to 'third' casters");
});

describe("getAvailableSpellLevels (single-class wrapper)", () => {
  it("matches the multi-entry version for one class", () => {
    expect(getAvailableSpellLevels(Wizard2014, undefined, 3)).toEqual([0, 1, 2]);
    expect(getAvailableSpellLevels(undefined, undefined, 3)).toEqual([]);
  });
});

describe("getSpellLimits", () => {
  it("uses ability modifier + level for a 'prepared' caster", () => {
    const limits = getSpellLimits([entry(Wizard2014, 1)], scores({ intelligence: 16 }));
    expect(limits).toEqual({ availableLevels: [0, 1], maxCantrips: 3, maxLeveled: 4 });
  });

  it("never lets a prepared caster prepare fewer than 1 spell", () => {
    const limits = getSpellLimits([entry(Wizard2024, 1)], scores({ intelligence: 6 }));
    expect(limits.maxLeveled).toBe(1);
  });

  it("uses the shared 'spells known' table for a 2014 'known' caster, ignoring the ability score", () => {
    const low = getSpellLimits([entry(Sorcerer2014, 1)], scores({ charisma: 8 }));
    const high = getSpellLimits([entry(Sorcerer2014, 1)], scores({ charisma: 20 }));
    expect(low.maxLeveled).toBe(2);
    expect(high.maxLeveled).toBe(2);
    expect(getSpellLimits([entry(Sorcerer2014, 20)], scores()).maxLeveled).toBe(17);
  });

  it("grows the cantrip cap at levels 4 and 10 for full casters", () => {
    expect(getSpellLimits([entry(Wizard2014, 3)], scores()).maxCantrips).toBe(3);
    expect(getSpellLimits([entry(Wizard2014, 4)], scores()).maxCantrips).toBe(4);
    expect(getSpellLimits([entry(Wizard2014, 10)], scores()).maxCantrips).toBe(5);
  });

  it("gives half casters no cantrips", () => {
    const limits = getSpellLimits([entry(Paladin2014, 5)], scores({ charisma: 16 }));
    expect(limits.maxCantrips).toBe(0);
    expect(limits.availableLevels).toEqual([1, 2]);
  });

  it.todo("BUG: a 2014 Paladin prepares CHA mod + HALF their Paladin level (min 1); the code uses CHA mod + full level");

  it("uses the third-caster 'spells known' table for an Eldritch Knight", () => {
    expect(getSpellLimits([entry(Fighter2014, 3, EldritchKnight2014)], scores({ intelligence: 16 })).maxLeveled).toBe(3);
    expect(getSpellLimits([entry(Fighter2014, 20, EldritchKnight2014)], scores()).maxLeveled).toBe(13);
  });

  it("gives a non-caster zero of everything", () => {
    expect(getSpellLimits([entry(Fighter2024, 10)], scores())).toEqual({ availableLevels: [], maxCantrips: 0, maxLeveled: 0 });
  });

  it("sums each class's own cap when multiclassed", () => {
    const limits = getSpellLimits([entry(Wizard2014, 3), entry(Cleric2014, 2)], scores({ intelligence: 16, wisdom: 14 }));
    // Wizard: 3 + 3 = 6 prepared, 3 cantrips. Cleric: 2 + 2 = 4 prepared, 3 cantrips.
    expect(limits.maxCantrips).toBe(6);
    expect(limits.maxLeveled).toBe(10);
    // Combined caster level 5 unlocks 3rd-level slots.
    expect(limits.availableLevels).toEqual([0, 1, 2, 3]);
  });

  it("adds Mystic Arcanum's extra spell and unlocks its level above the Pact Magic cap", () => {
    const limits = getSpellLimits([entry(Warlock2024, 11)], scores({ charisma: 16 }));
    expect(limits.availableLevels).toEqual([0, 1, 2, 3, 4, 5, 6]);
    // 3 (CHA) + 11 (level) prepared, plus the 6th-level arcanum.
    expect(limits.maxLeveled).toBe(15);
  });

  it("stacks every Mystic Arcanum earned by level 17", () => {
    const limits = getSpellLimits([entry(Warlock2024, 17)], scores({ charisma: 10 }));
    expect(limits.availableLevels).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(limits.maxLeveled).toBe(17 + 4);
  });

  it("adds Pact of the Tome's bonus cantrips once that choice is resolved (2014)", () => {
    const entries = [entry(Warlock2014, 3)];
    const without = getSpellLimits(entries, scores());
    const withTome = getSpellLimits(entries, scores(), { "0:Pact Boon:pactBoon": "tome" });
    expect(withTome.maxCantrips).toBe(without.maxCantrips + 3);
    expect(withTome.maxLeveled).toBe(without.maxLeveled);
  });
});

describe("pruneSpellsToLimits", () => {
  const limits: SpellLimits = { availableLevels: [0, 1, 2], maxCantrips: 2, maxLeveled: 3 };

  it("keeps everything when it's all within limits", () => {
    const spells = [spellAt(0, "A"), spellAt(1, "B"), spellAt(2, "C")];
    expect(pruneSpellsToLimits(spells, limits)).toEqual(spells);
  });

  it("drops spells of a level that is no longer available", () => {
    const spells = [spellAt(1, "Keep"), spellAt(3, "Too high")];
    expect(pruneSpellsToLimits(spells, limits).map((spell) => spell.name)).toEqual(["Keep"]);
  });

  it("keeps the first-picked cantrips and leveled spells when over the caps", () => {
    const spells = [
      spellAt(0, "C1"),
      spellAt(1, "L1"),
      spellAt(0, "C2"),
      spellAt(0, "C3"),
      spellAt(2, "L2"),
      spellAt(1, "L3"),
      spellAt(1, "L4"),
    ];
    expect(pruneSpellsToLimits(spells, limits).map((spell) => spell.name)).toEqual(["C1", "C2", "L1", "L2", "L3"]);
  });

  it("drops out-of-level spells before applying the cap, so they don't use up a slot", () => {
    const spells = [spellAt(5, "Gone"), spellAt(1, "A"), spellAt(1, "B"), spellAt(1, "C")];
    expect(pruneSpellsToLimits(spells, limits).map((spell) => spell.name)).toEqual(["A", "B", "C"]);
  });

  it("returns an empty list when nothing is available", () => {
    expect(pruneSpellsToLimits([spellAt(0), spellAt(1)], { availableLevels: [], maxCantrips: 5, maxLeveled: 5 })).toEqual([]);
  });
});
