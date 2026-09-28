import { describe, it, expect } from "vitest";
import type { Character } from "@/interfaces/Characters";
import {
  getChosenWeaponMasteryIndexes,
  getWeaponMasteryCount,
  getWeaponMasteryLines,
  isWeaponMasteryActive,
  toggleWeaponMasteryChoice,
  WEAPON_MASTERY_EFFECTS,
} from "@/utils/weaponMastery";
import { Fighter as Fighter2024 } from "@/data/2024/classes/Fighter";
import { Barbarian as Barbarian2024 } from "@/data/2024/classes/Barbarian";
import { Paladin as Paladin2024 } from "@/data/2024/classes/Paladin";
import { Rogue as Rogue2024 } from "@/data/2024/classes/Rogue";
import { Wizard as Wizard2024 } from "@/data/2024/classes/Wizard";
import { Fighter as Fighter2014 } from "@/data/2014/classes/Fighter";
import { classLevel, makeCharacter, weapon } from "../../tests/fixtures/characters";

/** A 2024 Fighter carrying Longsword, Dagger, Longbow, Handaxe and a mastery-less custom weapon, in that order. */
function armedFighter(overrides: Partial<Character> = {}): Character {
  return makeCharacter({
    weapons: [weapon("Longsword"), weapon("Dagger"), weapon("Longbow"), weapon("Handaxe"), weapon("Club", { name: "Plain Stick", mastery: undefined })],
    ...overrides,
  });
}

describe("getWeaponMasteryCount", () => {
  it("is always 0 under 2014 rules", () => {
    expect(getWeaponMasteryCount([classLevel(Fighter2014, 20)], "2014")).toBe(0);
    expect(getWeaponMasteryCount([classLevel(Fighter2024, 20)], "2014")).toBe(0);
  });

  it.each([
    [1, 3],
    [3, 3],
    [4, 4],
    [9, 4],
    [10, 5],
    [16, 6],
    [20, 6],
  ])("a level %i 2024 Fighter can master %i weapons", (level, count) => {
    expect(getWeaponMasteryCount([classLevel(Fighter2024, level)], "2024")).toBe(count);
  });

  it("follows the Barbarian's own table", () => {
    expect(getWeaponMasteryCount([classLevel(Barbarian2024, 1)], "2024")).toBe(2);
    expect(getWeaponMasteryCount([classLevel(Barbarian2024, 4)], "2024")).toBe(3);
    expect(getWeaponMasteryCount([classLevel(Barbarian2024, 10)], "2024")).toBe(4);
  });

  it("is a flat 2 for Paladins and Rogues", () => {
    expect(getWeaponMasteryCount([classLevel(Paladin2024, 20)], "2024")).toBe(2);
    expect(getWeaponMasteryCount([classLevel(Rogue2024, 11)], "2024")).toBe(2);
  });

  it("is 0 for classes without Weapon Mastery", () => {
    expect(getWeaponMasteryCount([classLevel(Wizard2024, 20)], "2024")).toBe(0);
  });

  it("sums each class's count when multiclassed", () => {
    expect(getWeaponMasteryCount([classLevel(Fighter2024, 4), classLevel(Rogue2024, 1), classLevel(Wizard2024, 3)], "2024")).toBe(6);
  });

  it("is 0 below a table's first threshold", () => {
    const lateClass = { ...Wizard2024, weaponMasteryProgression: { 3: 2 } };
    expect(getWeaponMasteryCount([classLevel(lateClass, 2)], "2024")).toBe(0);
  });
});

describe("getChosenWeaponMasteryIndexes", () => {
  it("returns the stored picks when they're all valid", () => {
    expect(getChosenWeaponMasteryIndexes(armedFighter({ chosenWeaponMasteryIndexes: [0, 2] }))).toEqual([0, 2]);
  });

  it("returns nothing when the character has no stored picks", () => {
    expect(getChosenWeaponMasteryIndexes(armedFighter())).toEqual([]);
  });

  it("drops indexes that are out of range or point at a weapon with no mastery", () => {
    expect(getChosenWeaponMasteryIndexes(armedFighter({ chosenWeaponMasteryIndexes: [9, 4, 1] }))).toEqual([1]);
  });

  it("trims to the current cap, keeping the earliest picks", () => {
    // Level 1 Fighter: 3 masteries.
    expect(getChosenWeaponMasteryIndexes(armedFighter({ chosenWeaponMasteryIndexes: [3, 2, 1, 0] }))).toEqual([3, 2, 1]);
  });

  it("returns nothing under 2014 rules even with stored picks", () => {
    const character = makeCharacter({ edition: "2014", weapons: [weapon("Longsword")], chosenWeaponMasteryIndexes: [0] });
    expect(getChosenWeaponMasteryIndexes(character)).toEqual([]);
  });
});

describe("isWeaponMasteryActive", () => {
  it("is true only for a validly chosen weapon", () => {
    const character = armedFighter({ chosenWeaponMasteryIndexes: [0, 4] });
    expect(isWeaponMasteryActive(character, 0)).toBe(true);
    expect(isWeaponMasteryActive(character, 1)).toBe(false);
    expect(isWeaponMasteryActive(character, 4)).toBe(false);
  });
});

describe("toggleWeaponMasteryChoice", () => {
  it("adds a weapon when there is room", () => {
    expect(toggleWeaponMasteryChoice(armedFighter({ chosenWeaponMasteryIndexes: [0] }), 2)).toEqual([0, 2]);
  });

  it("removes an already-chosen weapon", () => {
    expect(toggleWeaponMasteryChoice(armedFighter({ chosenWeaponMasteryIndexes: [0, 2] }), 0)).toEqual([2]);
  });

  it("refuses to go over the cap", () => {
    expect(toggleWeaponMasteryChoice(armedFighter({ chosenWeaponMasteryIndexes: [0, 1, 2] }), 3)).toEqual([0, 1, 2]);
  });

  it("ignores weapons without a mastery property and indexes that don't exist", () => {
    const character = armedFighter({ chosenWeaponMasteryIndexes: [0] });
    expect(toggleWeaponMasteryChoice(character, 4)).toEqual([0]);
    expect(toggleWeaponMasteryChoice(character, 42)).toEqual([0]);
  });

  it("cleans up stale picks while toggling", () => {
    expect(toggleWeaponMasteryChoice(armedFighter({ chosenWeaponMasteryIndexes: [7, 0] }), 1)).toEqual([0, 1]);
  });

  it("can't add anything under 2014 rules", () => {
    const character = makeCharacter({ edition: "2014", weapons: [weapon("Longsword")] });
    expect(toggleWeaponMasteryChoice(character, 0)).toEqual([]);
  });
});

describe("WEAPON_MASTERY_EFFECTS", () => {
  it("covers all eight mastery properties", () => {
    expect(Object.keys(WEAPON_MASTERY_EFFECTS).sort()).toEqual(["Cleave", "Graze", "Nick", "Push", "Sap", "Slow", "Topple", "Vex"]);
  });

  it("marks which masteries trigger an extra roll", () => {
    expect(WEAPON_MASTERY_EFFECTS.Cleave.rollKind).toBe("attackRoll");
    expect(WEAPON_MASTERY_EFFECTS.Nick.rollKind).toBe("attackRoll");
    expect(WEAPON_MASTERY_EFFECTS.Vex.rollKind).toBe("advantageAttackRoll");
    expect(WEAPON_MASTERY_EFFECTS.Topple.rollKind).toBe("none");
    for (const effect of Object.values(WEAPON_MASTERY_EFFECTS)) {
      if (effect.rollKind !== "none") expect(effect.rollLabel).toBeTruthy();
    }
  });
});

describe("getWeaponMasteryLines", () => {
  it("shows Graze's damage on a miss as the ability modifier", () => {
    expect(getWeaponMasteryLines(makeCharacter(), weapon("Greatsword"), 3)).toEqual([{ label: "Bonus damage on a miss", value: "+3" }]);
  });

  it("shows Topple's save DC as 8 + proficiency + ability modifier", () => {
    expect(getWeaponMasteryLines(makeCharacter(), weapon("Quarterstaff"), 3)).toEqual([{ label: "Save DC (Constitution)", value: "13" }]);
    const level9 = makeCharacter({ classes: [classLevel(Fighter2024, 9)] });
    expect(getWeaponMasteryLines(level9, weapon("Quarterstaff"), 5)).toEqual([{ label: "Save DC (Constitution)", value: "17" }]);
  });

  it("has no lines for other masteries or for weapons without one", () => {
    expect(getWeaponMasteryLines(makeCharacter(), weapon("Longsword"), 3)).toEqual([]);
    expect(getWeaponMasteryLines(makeCharacter(), weapon("Longsword", { mastery: undefined }), 3)).toEqual([]);
  });
});
