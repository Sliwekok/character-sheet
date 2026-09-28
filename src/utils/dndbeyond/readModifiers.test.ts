import { describe, it, expect } from "vitest";
import type { DdbGrantedModifier, DdbModifierGroups } from "@/utils/dndbeyond/types";
import {
  hasReadableModifiers,
  PERMANENT_ABILITY_BONUS_GROUPS,
  readAbilityScoreBonuses,
  readSkillProficiencies,
} from "@/utils/dndbeyond/readModifiers";

const bonus = (subType: string, value: number | null, extra: Partial<DdbGrantedModifier> = {}): DdbGrantedModifier => ({
  type: "bonus",
  subType,
  value,
  ...extra,
});
const proficiency = (subType: string): DdbGrantedModifier => ({ type: "proficiency", subType });

/** Lets a test feed deliberately malformed data through the typed API. */
const malformed = (value: unknown) => value as DdbModifierGroups;

describe("readAbilityScoreBonuses", () => {
  it("sums ability-score bonuses across every group", () => {
    const modifiers: DdbModifierGroups = {
      race: [bonus("strength-score", 2), bonus("constitution-score", 1)],
      feat: [bonus("strength-score", 1)],
      class: [],
    };
    expect(readAbilityScoreBonuses(modifiers)).toEqual({ strength: 3, constitution: 1 });
  });

  it("maps every ability sub-type", () => {
    const modifiers: DdbModifierGroups = {
      background: ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"].map((ability) => bonus(`${ability}-score`, 1)),
    };
    expect(readAbilityScoreBonuses(modifiers)).toEqual({
      strength: 1,
      dexterity: 1,
      constitution: 1,
      intelligence: 1,
      wisdom: 1,
      charisma: 1,
    });
  });

  it("falls back to fixedValue when value is missing", () => {
    expect(readAbilityScoreBonuses({ race: [bonus("wisdom-score", null, { fixedValue: 2 })] })).toEqual({ wisdom: 2 });
  });

  it("ignores zero bonuses, non-bonus types and unrelated sub-types", () => {
    const modifiers: DdbModifierGroups = {
      race: [
        bonus("dexterity-score", 0),
        bonus("speed", 10),
        { type: "set", subType: "strength-score", value: 19 },
        { type: "bonus", value: 2 },
        proficiency("stealth"),
      ],
    };
    expect(readAbilityScoreBonuses(modifiers)).toEqual({});
  });

  it("only counts the requested groups (e.g. leaving out magic items)", () => {
    const modifiers: DdbModifierGroups = {
      race: [bonus("strength-score", 2)],
      item: [bonus("strength-score", 4)],
      condition: [bonus("strength-score", -2)],
    };
    expect(readAbilityScoreBonuses(modifiers, PERMANENT_ABILITY_BONUS_GROUPS)).toEqual({ strength: 2 });
    expect(readAbilityScoreBonuses(modifiers)).toEqual({ strength: 4 });
  });

  it("returns nothing for missing or malformed data instead of throwing", () => {
    expect(readAbilityScoreBonuses(undefined)).toEqual({});
    expect(readAbilityScoreBonuses(malformed("nope"))).toEqual({});
    expect(readAbilityScoreBonuses(malformed({ race: "nope", feat: [null, bonus("strength-score", 2)] }))).toEqual({});
  });

  it("still reads well-formed groups next to malformed ones", () => {
    expect(readAbilityScoreBonuses(malformed({ race: 5, feat: [bonus("charisma-score", 1)] }))).toEqual({ charisma: 1 });
  });
});

describe("PERMANENT_ABILITY_BONUS_GROUPS", () => {
  it("covers race, class, background and feats but not items or conditions", () => {
    expect(PERMANENT_ABILITY_BONUS_GROUPS).toEqual(expect.arrayContaining(["race", "class", "background", "feat"]));
    expect(PERMANENT_ABILITY_BONUS_GROUPS).not.toContain("item");
    expect(PERMANENT_ABILITY_BONUS_GROUPS).not.toContain("condition");
  });
});

describe("readSkillProficiencies", () => {
  it("maps D&D Beyond's skill sub-types to this app's skill names", () => {
    const modifiers: DdbModifierGroups = {
      class: [proficiency("athletics"), proficiency("sleight-of-hand")],
      background: [proficiency("animal-handling")],
    };
    expect(readSkillProficiencies(modifiers)).toEqual(["Athletics", "Sleight of Hand", "Animal Handling"]);
  });

  it("lists a skill granted twice only once", () => {
    expect(readSkillProficiencies({ race: [proficiency("perception")], feat: [proficiency("perception")] })).toEqual(["Perception"]);
  });

  it("ignores non-skill proficiencies and non-proficiency grants", () => {
    const modifiers: DdbModifierGroups = {
      class: [proficiency("strength-saving-throws"), proficiency("longsword"), { type: "expertise", subType: "stealth" }, bonus("athletics", 1)],
    };
    expect(readSkillProficiencies(modifiers)).toEqual([]);
  });

  it("returns nothing for missing or malformed data", () => {
    expect(readSkillProficiencies(undefined)).toEqual([]);
    expect(readSkillProficiencies(malformed({ class: "athletics" }))).toEqual([]);
  });
});

describe("hasReadableModifiers", () => {
  it("is true when at least one group is a readable list, even an empty one", () => {
    expect(hasReadableModifiers({ race: [] })).toBe(true);
    expect(hasReadableModifiers(malformed({ race: "x", class: [proficiency("arcana")] }))).toBe(true);
  });

  it("is false when nothing can be read", () => {
    expect(hasReadableModifiers(undefined)).toBe(false);
    expect(hasReadableModifiers({})).toBe(false);
    expect(hasReadableModifiers(malformed({ race: "x", class: [1, 2] }))).toBe(false);
    expect(hasReadableModifiers(malformed("modifiers"))).toBe(false);
  });
});
