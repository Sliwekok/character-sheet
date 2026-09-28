import { describe, it, expect } from "vitest";
import { getChosenFightingStyleEffects } from "@/utils/fightingStyles";
import { Fighter as Fighter2024 } from "@/data/2024/classes/Fighter";
import { Fighter as Fighter2014 } from "@/data/2014/classes/Fighter";
import { Paladin as Paladin2024 } from "@/data/2024/classes/Paladin";
import { Wizard as Wizard2024 } from "@/data/2024/classes/Wizard";
import { FighterSubclasses as FighterSubclasses2024 } from "@/data/2024/subclasses/Fighter";
import { FighterSubclasses as FighterSubclasses2014 } from "@/data/2014/subclasses/Fighter";
import { classLevel, makeCharacter } from "../../tests/fixtures/characters";
import { feature, makeClass } from "../../tests/fixtures/spells";

const Champion2024 = FighterSubclasses2024.find((subclass) => subclass.name === "Champion")!;
const Champion2014 = FighterSubclasses2014.find((subclass) => subclass.name === "Champion")!;

const ARCHERY = { styleName: "Archery", rangedAttackRollBonus: 2 };
const DEFENSE = { styleName: "Defense", armorClassBonusWhileArmored: 1 };
const DUELING = { styleName: "Dueling", meleeOneHandedDamageBonus: 2 };

describe("getChosenFightingStyleEffects", () => {
  it("returns nothing when no choice has been made", () => {
    expect(getChosenFightingStyleEffects(makeCharacter())).toEqual([]);
    expect(getChosenFightingStyleEffects(makeCharacter({ featureChoices: {} }))).toEqual([]);
  });

  it("returns the effect of a Fighter's chosen style (2024)", () => {
    const character = makeCharacter({ featureChoices: { "0:Fighting Style:fightingStyle": "archery" } });
    expect(getChosenFightingStyleEffects(character)).toEqual([ARCHERY]);
  });

  it("returns the effect of a Fighter's chosen style (2014)", () => {
    const character = makeCharacter({ edition: "2014", featureChoices: { "0:Fighting Style:fightingStyle": "defense" } });
    expect(getChosenFightingStyleEffects(character)).toEqual([DEFENSE]);
  });

  it("ignores styles that have no tracked mechanical effect", () => {
    const character = makeCharacter({ featureChoices: { "0:Fighting Style:fightingStyle": "greatWeaponFighting" } });
    expect(getChosenFightingStyleEffects(character)).toEqual([]);
  });

  it("ignores an unknown option id", () => {
    const character = makeCharacter({ featureChoices: { "0:Fighting Style:fightingStyle": "kung-fu" } });
    expect(getChosenFightingStyleEffects(character)).toEqual([]);
  });

  it("includes a Champion's Additional Fighting Style only once it's reached (level 7 in 2024, 10 in 2014)", () => {
    const choices = { "0:Fighting Style:fightingStyle": "archery", "0:Additional Fighting Style:fightingStyle2": "dueling" };
    const level6 = makeCharacter({ classes: [classLevel(Fighter2024, 6, { subclass: Champion2024 })], featureChoices: choices });
    const level7 = makeCharacter({ classes: [classLevel(Fighter2024, 7, { subclass: Champion2024 })], featureChoices: choices });
    expect(getChosenFightingStyleEffects(level6)).toEqual([ARCHERY]);
    expect(getChosenFightingStyleEffects(level7)).toEqual([ARCHERY, DUELING]);

    const level9Of2014 = makeCharacter({ edition: "2014", classes: [classLevel(Fighter2014, 9, { subclass: Champion2014 })], featureChoices: choices });
    const level10Of2014 = makeCharacter({ edition: "2014", classes: [classLevel(Fighter2014, 10, { subclass: Champion2014 })], featureChoices: choices });
    expect(getChosenFightingStyleEffects(level9Of2014)).toEqual([ARCHERY]);
    expect(getChosenFightingStyleEffects(level10Of2014)).toEqual([ARCHERY, DUELING]);
  });

  it("never counts the same style twice, even from two different features", () => {
    const character = makeCharacter({
      classes: [classLevel(Fighter2024, 7, { subclass: Champion2024 })],
      featureChoices: { "0:Fighting Style:fightingStyle": "archery", "0:Additional Fighting Style:fightingStyle2": "archery" },
    });
    expect(getChosenFightingStyleEffects(character)).toEqual([ARCHERY]);
  });

  it("dedupes the same style picked by two different classes", () => {
    const character = makeCharacter({
      classes: [classLevel(Fighter2024, 1), classLevel(Paladin2024, 2)],
      featureChoices: { "0:Fighting Style:fightingStyle": "dueling", "1:Fighting Style:fightingStyle": "dueling" },
    });
    expect(getChosenFightingStyleEffects(character)).toEqual([DUELING]);
  });

  it("keys picks by class position, so a Fighter taken second reads its own slot", () => {
    const character = makeCharacter({
      classes: [classLevel(Wizard2024, 3), classLevel(Fighter2024, 1)],
      featureChoices: { "0:Fighting Style:fightingStyle": "archery", "1:Fighting Style:fightingStyle": "defense" },
    });
    expect(getChosenFightingStyleEffects(character)).toEqual([DEFENSE]);
  });

  it("does not apply a Paladin's style before Paladin level 2", () => {
    const character = makeCharacter({ classes: [classLevel(Paladin2024, 1)], featureChoices: { "0:Fighting Style:fightingStyle": "defense" } });
    expect(getChosenFightingStyleEffects(character)).toEqual([]);
  });

  it("supports multi-select choices stored as comma-joined ids", () => {
    const styles = feature("Many Styles", 1, {
      choice: {
        key: "styles",
        prompt: "Pick two",
        countByLevel: { 1: 2 },
        options: [
          { id: "a", label: "A", fightingStyleEffect: ARCHERY },
          { id: "d", label: "D", fightingStyleEffect: DEFENSE },
        ],
      },
    });
    const character = makeCharacter({ classes: [classLevel(makeClass({ features: [styles] }), 1)], featureChoices: { "0:Many Styles:styles": "a,d" } });
    expect(getChosenFightingStyleEffects(character)).toEqual([ARCHERY, DEFENSE]);
  });
});

