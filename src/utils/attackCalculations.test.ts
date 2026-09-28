import { describe, it, expect } from "vitest";
import type { AbilityScores, Character } from "@/interfaces/Characters";
import type { MagicItem } from "@/interfaces/MagicItem";
import {
  getSpellcastingInfo,
  getUnarmedStrikeWeapon,
  getWeaponAbility,
  getWeaponAttackInfo,
  getWeaponDamageInfo,
  isProficientWithWeapon,
  sneakAttackDamageBonus,
} from "@/utils/attackCalculations";
import { Fighter as Fighter2014 } from "@/data/2014/classes/Fighter";
import { Wizard as Wizard2014 } from "@/data/2014/classes/Wizard";
import { Cleric as Cleric2014 } from "@/data/2014/classes/Cleric";
import { Rogue as Rogue2014 } from "@/data/2014/classes/Rogue";
import { Monk as Monk2014 } from "@/data/2014/classes/Monk";
import { Bard as Bard2014 } from "@/data/2014/classes/Bard";
import { Fighter as Fighter2024 } from "@/data/2024/classes/Fighter";
import { Wizard as Wizard2024 } from "@/data/2024/classes/Wizard";
import { Rogue as Rogue2024 } from "@/data/2024/classes/Rogue";
import { Monk as Monk2024 } from "@/data/2024/classes/Monk";
import { Cleric as Cleric2024 } from "@/data/2024/classes/Cleric";
import { FighterSubclasses as FighterSubclasses2024 } from "@/data/2024/subclasses/Fighter";
import { armor, classLevel, makeCharacter, weapon } from "../../tests/fixtures/characters";

const Champion2024 = FighterSubclasses2024.find((subclass) => subclass.name === "Champion")!;

/** Key under which a Fighter's level-1 Fighting Style pick is stored (see grantedSpells.featureChoiceKey). */
const FIGHTING_STYLE = "0:Fighting Style:fightingStyle";
const CHAMPION_SECOND_STYLE = "0:Additional Fighting Style:fightingStyle2";

const withScores = (overrides: Partial<AbilityScores>): AbilityScores => ({
  strength: 10,
  dexterity: 10,
  constitution: 10,
  intelligence: 10,
  wisdom: 10,
  charisma: 10,
  ...overrides,
});

/** 2024 Fighter with the given scores/overrides. */
const fighter = (scores: Partial<AbilityScores>, overrides: Partial<Character> = {}) =>
  makeCharacter({ abilityScores: withScores(scores), ...overrides });

const magicItem = (name: string, bonuses: MagicItem["bonuses"]): MagicItem => ({
  name,
  category: "wondrous item",
  rarity: "rare",
  requiresAttunement: false,
  description: "",
  bonuses,
});

describe("getWeaponAbility", () => {
  it("uses Strength for ordinary melee weapons", () => {
    expect(getWeaponAbility(weapon("Longsword"), withScores({ strength: 8, dexterity: 18 }))).toBe("strength");
  });

  it("uses Dexterity for ranged weapons", () => {
    expect(getWeaponAbility(weapon("Longbow"), withScores({ strength: 18, dexterity: 8 }))).toBe("dexterity");
  });

  it("uses Strength for thrown melee weapons without finesse (javelin, handaxe)", () => {
    expect(getWeaponAbility(weapon("Javelin"), withScores({ strength: 10, dexterity: 18 }))).toBe("strength");
    expect(getWeaponAbility(weapon("Handaxe"), withScores({ strength: 10, dexterity: 18 }))).toBe("strength");
  });

  it("uses the better of Strength and Dexterity for finesse weapons", () => {
    expect(getWeaponAbility(weapon("Rapier"), withScores({ strength: 10, dexterity: 16 }))).toBe("dexterity");
    expect(getWeaponAbility(weapon("Rapier"), withScores({ strength: 16, dexterity: 10 }))).toBe("strength");
    expect(getWeaponAbility(weapon("Dart"), withScores({ strength: 16, dexterity: 10 }))).toBe("strength");
  });

  it("falls back to Strength for finesse weapons when the modifiers tie", () => {
    // 14 and 15 are both +2.
    expect(getWeaponAbility(weapon("Dagger"), withScores({ strength: 14, dexterity: 15 }))).toBe("strength");
  });
});

describe("isProficientWithWeapon", () => {
  it("is proficient via a category ('Martial weapons')", () => {
    expect(isProficientWithWeapon(makeCharacter(), weapon("Greatsword"))).toBe(true);
    expect(isProficientWithWeapon(makeCharacter({ edition: "2014" }), weapon("Longbow"))).toBe(true);
  });

  it("is proficient via an individually named weapon (2014 Wizard's daggers, quarterstaffs, light crossbows)", () => {
    const wizard = makeCharacter({ edition: "2014", classes: [classLevel(Wizard2014, 1)] });
    expect(isProficientWithWeapon(wizard, weapon("Dagger"))).toBe(true);
    expect(isProficientWithWeapon(wizard, weapon("Quarterstaff"))).toBe(true);
    expect(isProficientWithWeapon(wizard, weapon("Light Crossbow"))).toBe(true);
  });

  it("is not proficient with weapons outside the class's list", () => {
    const wizard = makeCharacter({ edition: "2014", classes: [classLevel(Wizard2014, 1)] });
    expect(isProficientWithWeapon(wizard, weapon("Longsword"))).toBe(false);
    expect(isProficientWithWeapon(wizard, weapon("Mace"))).toBe(false);

    const wizard2024 = makeCharacter({ classes: [classLevel(Wizard2024, 1)] });
    expect(isProficientWithWeapon(wizard2024, weapon("Dagger"))).toBe(true);
    expect(isProficientWithWeapon(wizard2024, weapon("Longsword"))).toBe(false);
  });

  it("gives a 2014 Rogue/Bard their named martial weapons but not other martial weapons", () => {
    const rogue = makeCharacter({ edition: "2014", classes: [classLevel(Rogue2014, 1)] });
    expect(isProficientWithWeapon(rogue, weapon("Rapier"))).toBe(true);
    expect(isProficientWithWeapon(rogue, weapon("Longsword"))).toBe(true);
    expect(isProficientWithWeapon(rogue, weapon("Shortsword"))).toBe(true);
    expect(isProficientWithWeapon(rogue, weapon("Greatsword"))).toBe(false);
    const bard = makeCharacter({ edition: "2014", classes: [classLevel(Bard2014, 1)] });
    expect(isProficientWithWeapon(bard, weapon("Longbow"))).toBe(false);
  });

  it.todo(
    "BUG: a 2024 Rogue ('Martial weapons that have the Finesse or Light property') or 2024 Monk ('...Light property') counts as proficient with every martial weapon, e.g. Greatsword/Longbow"
  );

  it("only uses a multiclassed class's narrower multiclass proficiencies", () => {
    // Wizard first, Fighter second: Fighter's multiclass list grants martial weapons.
    const wizardFighter = makeCharacter({ edition: "2014", classes: [classLevel(Wizard2014, 1), classLevel(Fighter2014, 1)] });
    expect(isProficientWithWeapon(wizardFighter, weapon("Longsword"))).toBe(true);

    // Wizard first, Cleric second: Cleric's multiclass entry grants no weapons at all.
    const wizardCleric = makeCharacter({ edition: "2014", classes: [classLevel(Wizard2014, 1), classLevel(Cleric2014, 1)] });
    expect(isProficientWithWeapon(wizardCleric, weapon("Mace"))).toBe(false);

    // Cleric first gets the full list.
    const clericWizard = makeCharacter({ edition: "2014", classes: [classLevel(Cleric2014, 1), classLevel(Wizard2014, 1)] });
    expect(isProficientWithWeapon(clericWizard, weapon("Mace"))).toBe(true);
  });

  it("always counts unarmed strikes as proficient", () => {
    const wizard = makeCharacter({ classes: [classLevel(Wizard2024, 1)] });
    expect(isProficientWithWeapon(wizard, getUnarmedStrikeWeapon(wizard))).toBe(true);
  });
});

describe("getWeaponAttackInfo", () => {
  it("adds ability modifier and proficiency bonus", () => {
    const info = getWeaponAttackInfo(fighter({ strength: 16 }), weapon("Longsword"));
    expect(info).toMatchObject({
      ability: "strength",
      abilityModifier: 3,
      proficient: true,
      proficiencyBonus: 2,
      magicBonus: 0,
      magicItemBonus: 0,
      fightingStyleBonus: 0,
      attackBonus: 5,
    });
    expect(info.lines).toEqual([
      { label: "Strength modifier", value: "+3" },
      { label: "Proficiency bonus", value: "+2" },
      { label: "Attack bonus", value: "+5" },
    ]);
  });

  it("uses the total character level for proficiency", () => {
    const level9 = fighter({ strength: 16 }, { classes: [classLevel(Fighter2024, 9)] });
    expect(getWeaponAttackInfo(level9, weapon("Longsword")).attackBonus).toBe(3 + 4);
    const multiclass = fighter({ strength: 16 }, { classes: [classLevel(Fighter2024, 3), classLevel(Wizard2024, 2)] });
    expect(getWeaponAttackInfo(multiclass, weapon("Longsword")).proficiencyBonus).toBe(3);
  });

  it("uses the better ability for finesse weapons and Dex for ranged weapons", () => {
    const character = fighter({ strength: 8, dexterity: 18 });
    expect(getWeaponAttackInfo(character, weapon("Rapier")).attackBonus).toBe(4 + 2);
    expect(getWeaponAttackInfo(character, weapon("Longbow")).attackBonus).toBe(4 + 2);
    expect(getWeaponAttackInfo(character, weapon("Longsword")).attackBonus).toBe(-1 + 2);
  });

  it("drops the proficiency bonus when not proficient", () => {
    const wizard = makeCharacter({ edition: "2014", classes: [classLevel(Wizard2014, 5)], abilityScores: withScores({ strength: 14 }) });
    const info = getWeaponAttackInfo(wizard, weapon("Greatsword"));
    expect(info.proficient).toBe(false);
    expect(info.proficiencyBonus).toBe(0);
    expect(info.attackBonus).toBe(2);
    expect(info.lines).toContainEqual({ label: "Proficiency bonus", value: "+0 (not proficient)" });
  });

  it("adds a magic weapon's bonus", () => {
    const info = getWeaponAttackInfo(fighter({ strength: 16 }), weapon("Longsword", { bonus: 2 }));
    expect(info.magicBonus).toBe(2);
    expect(info.attackBonus).toBe(7);
    expect(info.lines).toContainEqual({ label: "Magic bonus", value: "+2" });
  });

  it("adds attack bonuses from carried magic items, with one line per item", () => {
    const character = fighter({ strength: 16 }, { magicItems: [magicItem("+1 Ammunition", { attackRolls: 1, damageRolls: 1 }), magicItem("Bag of Holding", undefined)] });
    const info = getWeaponAttackInfo(character, weapon("Longsword"));
    expect(info.magicItemBonus).toBe(1);
    expect(info.attackBonus).toBe(6);
    expect(info.lines).toContainEqual({ label: "+1 Ammunition (magic item)", value: "+1" });
  });

  it("shows negative ability modifiers with a minus sign", () => {
    const info = getWeaponAttackInfo(fighter({ strength: 6 }), weapon("Club"));
    expect(info.attackBonus).toBe(0);
    expect(info.lines[0]).toEqual({ label: "Strength modifier", value: "-2" });
  });

  describe("Archery fighting style", () => {
    it("adds +2 to ranged attacks (2024)", () => {
      const character = fighter({ dexterity: 16 }, { featureChoices: { [FIGHTING_STYLE]: "archery" } });
      const info = getWeaponAttackInfo(character, weapon("Longbow"));
      expect(info.fightingStyleBonus).toBe(2);
      expect(info.attackBonus).toBe(3 + 2 + 2);
      expect(info.lines).toContainEqual({ label: "Archery (Fighting Style)", value: "+2" });
    });

    it("adds +2 to ranged attacks (2014)", () => {
      const character = makeCharacter({ edition: "2014", abilityScores: withScores({ dexterity: 16 }), featureChoices: { [FIGHTING_STYLE]: "archery" } });
      expect(getWeaponAttackInfo(character, weapon("Light Crossbow")).attackBonus).toBe(7);
    });

    it("does nothing for melee weapons", () => {
      const character = fighter({ strength: 16 }, { featureChoices: { [FIGHTING_STYLE]: "archery" } });
      expect(getWeaponAttackInfo(character, weapon("Longsword")).fightingStyleBonus).toBe(0);
    });

    it("isn't doubled when the same style is picked again by a Champion's Additional Fighting Style", () => {
      const character = fighter(
        { dexterity: 16 },
        {
          classes: [classLevel(Fighter2024, 7, { subclass: Champion2024 })],
          featureChoices: { [FIGHTING_STYLE]: "archery", [CHAMPION_SECOND_STYLE]: "archery" },
        }
      );
      expect(getWeaponAttackInfo(character, weapon("Longbow")).fightingStyleBonus).toBe(2);
    });
  });
});

describe("getWeaponDamageInfo", () => {
  it("adds the ability modifier to the weapon's damage dice", () => {
    const info = getWeaponDamageInfo(fighter({ strength: 16 }), weapon("Longsword"));
    expect(info).toMatchObject({
      diceFormula: "1d8",
      damageType: "slashing",
      abilityModifier: 3,
      magicBonus: 0,
      magicItemBonus: 0,
      fightingStyleBonus: 0,
      sneakAttackDice: 0,
      flatBonus: 3,
    });
    expect(info.lines).toEqual([
      { label: "Base damage", value: "1d8" },
      { label: "Strength modifier", value: "+3" },
      { label: "Damage type", value: "slashing" },
    ]);
  });

  it("uses the versatile die when wielded two-handed", () => {
    expect(getWeaponDamageInfo(fighter({ strength: 16 }), weapon("Longsword"), true).diceFormula).toBe("1d10");
    expect(getWeaponDamageInfo(fighter({ strength: 16 }), weapon("Quarterstaff"), true).diceFormula).toBe("1d8");
  });

  it("ignores the versatile flag for a weapon without versatile damage", () => {
    expect(getWeaponDamageInfo(fighter({ strength: 16 }), weapon("Greatsword"), true).diceFormula).toBe("2d6");
  });

  it("uses the same ability as the attack roll (finesse / ranged)", () => {
    const character = fighter({ strength: 8, dexterity: 18 });
    expect(getWeaponDamageInfo(character, weapon("Rapier")).flatBonus).toBe(4);
    expect(getWeaponDamageInfo(character, weapon("Longbow")).flatBonus).toBe(4);
  });

  it("adds magic weapon and magic item damage bonuses", () => {
    const character = fighter({ strength: 16 }, { magicItems: [magicItem("+1 Ammunition", { attackRolls: 1, damageRolls: 1 })] });
    const info = getWeaponDamageInfo(character, weapon("Longsword", { bonus: 1 }));
    expect(info.magicBonus).toBe(1);
    expect(info.magicItemBonus).toBe(1);
    expect(info.flatBonus).toBe(5);
  });

  it("can produce a negative flat bonus", () => {
    expect(getWeaponDamageInfo(fighter({ strength: 6 }), weapon("Club")).flatBonus).toBe(-2);
  });

  describe("Dueling fighting style", () => {
    const dueling = { featureChoices: { [FIGHTING_STYLE]: "dueling" } };

    it("adds +2 damage to a one-handed melee weapon wielded alone", () => {
      const character = fighter({ strength: 16 }, { ...dueling, weapons: [weapon("Longsword")] });
      const info = getWeaponDamageInfo(character, weapon("Longsword"));
      expect(info.fightingStyleBonus).toBe(2);
      expect(info.flatBonus).toBe(5);
      expect(info.lines).toContainEqual({ label: "Dueling (Fighting Style)", value: "+2" });
    });

    it("does not apply when a versatile weapon is used two-handed", () => {
      const character = fighter({ strength: 16 }, { ...dueling, weapons: [weapon("Longsword")] });
      expect(getWeaponDamageInfo(character, weapon("Longsword"), true).fightingStyleBonus).toBe(0);
    });

    it("does not apply to two-handed or ranged weapons", () => {
      const greatsword = fighter({ strength: 16 }, { ...dueling, weapons: [weapon("Greatsword")] });
      expect(getWeaponDamageInfo(greatsword, weapon("Greatsword")).fightingStyleBonus).toBe(0);
      const longbow = fighter({ dexterity: 16 }, { ...dueling, weapons: [weapon("Longbow")] });
      expect(getWeaponDamageInfo(longbow, weapon("Longbow")).fightingStyleBonus).toBe(0);
    });

    it("does not apply while carrying a second weapon", () => {
      const character = fighter({ strength: 16 }, { ...dueling, weapons: [weapon("Longsword"), weapon("Dagger")] });
      expect(getWeaponDamageInfo(character, weapon("Longsword")).fightingStyleBonus).toBe(0);
    });

    it("works the same under 2014 rules", () => {
      const character = makeCharacter({ edition: "2014", abilityScores: withScores({ strength: 16 }), weapons: [weapon("Rapier")], ...dueling });
      expect(getWeaponDamageInfo(character, weapon("Rapier")).flatBonus).toBe(5);
    });
  });

  describe("Thrown Weapon Fighting (2024)", () => {
    const thrown = { featureChoices: { [FIGHTING_STYLE]: "thrownWeaponFighting" } };

    it("adds +2 damage to a ranged thrown weapon (dart)", () => {
      const character = fighter({ dexterity: 16 }, { ...thrown, weapons: [weapon("Dart")] });
      expect(getWeaponDamageInfo(character, weapon("Dart")).fightingStyleBonus).toBe(2);
    });

    it("does not add damage to non-thrown weapons", () => {
      const character = fighter({ strength: 16 }, { ...thrown, weapons: [weapon("Longsword")] });
      expect(getWeaponDamageInfo(character, weapon("Longsword")).fightingStyleBonus).toBe(0);
    });

    it.todo(
      "BUG: Thrown Weapon Fighting never applies to melee-type thrown weapons (Javelin, Handaxe, Spear, Dagger) - fightingStyleDamageBonus picks the Dueling field for any one-handed melee weapon, so thrownWeaponDamageBonus is never read for them"
    );
  });

  describe("Sneak Attack", () => {
    it("adds Sneak Attack dice only when asked to", () => {
      const rogue = makeCharacter({ edition: "2014", classes: [classLevel(Rogue2014, 5)], abilityScores: withScores({ dexterity: 16 }) });
      expect(getWeaponDamageInfo(rogue, weapon("Rapier")).sneakAttackDice).toBe(0);
      const info = getWeaponDamageInfo(rogue, weapon("Rapier"), false, true);
      expect(info.sneakAttackDice).toBe(3);
      expect(info.flatBonus).toBe(3); // dice count is kept separate from the flat bonus
      expect(info.lines).toContainEqual({ label: "Sneak Attack (3d6)", value: "+3d6" });
    });
  });
});

describe("sneakAttackDamageBonus", () => {
  it.each([
    [1, 1],
    [2, 1],
    [3, 2],
    [4, 2],
    [9, 5],
    [19, 10],
    [20, 10],
  ])("a level %i Rogue gets %id6 (2014 and 2024)", (level, dice) => {
    expect(sneakAttackDamageBonus(makeCharacter({ edition: "2014", classes: [classLevel(Rogue2014, level)] })).dice).toBe(dice);
    expect(sneakAttackDamageBonus(makeCharacter({ classes: [classLevel(Rogue2024, level)] })).dice).toBe(dice);
  });

  it("uses Rogue levels only when multiclassed", () => {
    const character = makeCharacter({ classes: [classLevel(Fighter2024, 5), classLevel(Rogue2024, 3)] });
    expect(sneakAttackDamageBonus(character).dice).toBe(2);
  });

  it("is 0 with no lines for a non-Rogue", () => {
    expect(sneakAttackDamageBonus(makeCharacter())).toEqual({ dice: 0, lines: [] });
  });
});

describe("getUnarmedStrikeWeapon", () => {
  it("deals a flat 1 bludgeoning (plus Str) for characters without Martial Arts", () => {
    const character = fighter({ strength: 16 });
    const unarmed = getUnarmedStrikeWeapon(character);
    expect(unarmed).toMatchObject({ name: "Unarmed Strike", damage: { dice: "1", type: "bludgeoning" }, properties: [], isUnarmedStrike: true });
    expect(getWeaponAttackInfo(character, unarmed).attackBonus).toBe(5);
    expect(getWeaponDamageInfo(character, unarmed).flatBonus).toBe(3);
  });

  it.each([
    [1, "1d4"],
    [4, "1d4"],
    [5, "1d6"],
    [11, "1d8"],
    [17, "1d10"],
  ])("a level %i 2014 Monk uses %s", (level, dice) => {
    const monk = makeCharacter({ edition: "2014", classes: [classLevel(Monk2014, level)] });
    expect(getUnarmedStrikeWeapon(monk).damage.dice).toBe(dice);
  });

  it.each([
    [1, "1d6"],
    [5, "1d8"],
    [11, "1d10"],
    [17, "1d12"],
  ])("a level %i 2024 Monk uses %s", (level, dice) => {
    const monk = makeCharacter({ classes: [classLevel(Monk2024, level)] });
    expect(getUnarmedStrikeWeapon(monk).damage.dice).toBe(dice);
  });

  it("lets a Monk use Dexterity when it's better", () => {
    const monk = makeCharacter({ classes: [classLevel(Monk2024, 1)], abilityScores: withScores({ strength: 10, dexterity: 16 }) });
    const unarmed = getUnarmedStrikeWeapon(monk);
    expect(unarmed.properties).toContain("finesse");
    expect(getWeaponAttackInfo(monk, unarmed)).toMatchObject({ ability: "dexterity", attackBonus: 5 });
  });

  it("loses Martial Arts while wearing armor or a shield", () => {
    const armored = makeCharacter({ classes: [classLevel(Monk2024, 5)], equippedArmor: armor("Leather") });
    expect(getUnarmedStrikeWeapon(armored)).toMatchObject({ damage: { dice: "1" }, properties: [] });
    const shielded = makeCharacter({ classes: [classLevel(Monk2024, 5)], shield: armor("Shield") });
    expect(getUnarmedStrikeWeapon(shielded).damage.dice).toBe("1");
  });

  it("uses the Monk die for a multiclassed Monk", () => {
    const character = makeCharacter({ classes: [classLevel(Fighter2024, 3), classLevel(Monk2024, 5)] });
    expect(getUnarmedStrikeWeapon(character).damage.dice).toBe("1d8");
  });
});

describe("getSpellcastingInfo", () => {
  it("returns null for a character with no spellcasting class", () => {
    expect(getSpellcastingInfo(makeCharacter())).toBeNull();
  });

  it("computes spell attack = prof + mod and save DC = 8 + prof + mod", () => {
    const wizard = makeCharacter({ classes: [classLevel(Wizard2024, 5)], abilityScores: withScores({ intelligence: 18 }) });
    const info = getSpellcastingInfo(wizard)!;
    expect(info).toMatchObject({
      className: "Wizard",
      ability: "intelligence",
      abilityLabel: "Intelligence",
      abilityModifier: 4,
      proficiencyBonus: 3,
      spellAttackBonus: 7,
      spellSaveDC: 15,
    });
    expect(info.lines).toEqual([
      { label: "Intelligence modifier", value: "+4" },
      { label: "Proficiency bonus", value: "+3" },
      { label: "Spell attack bonus", value: "+4 + 3 = +7" },
      { label: "Spell save DC", value: "8 + 4 + 3 = 15" },
    ]);
  });

  it("formats a negative modifier without doubling signs", () => {
    const cleric = makeCharacter({ edition: "2014", classes: [classLevel(Cleric2014, 1)], abilityScores: withScores({ wisdom: 8 }) });
    const info = getSpellcastingInfo(cleric)!;
    expect(info.spellAttackBonus).toBe(1);
    expect(info.spellSaveDC).toBe(9);
    expect(info.lines[2].value).toBe("-1 + 2 = +1");
    expect(info.lines[3].value).toBe("8 - 1 + 2 = 9");
  });

  it("uses the first class that has spellcasting when multiclassed", () => {
    const character = makeCharacter({
      classes: [classLevel(Fighter2024, 4), classLevel(Cleric2024, 1)],
      abilityScores: withScores({ wisdom: 16, intelligence: 8 }),
    });
    const info = getSpellcastingInfo(character)!;
    expect(info.className).toBe("Cleric");
    expect(info.ability).toBe("wisdom");
    expect(info.spellSaveDC).toBe(8 + 3 + 3);
  });

  it("uses a class's own spellSaveDC / spellAttackBonus functions when provided", () => {
    const customWizard = {
      ...Wizard2024,
      spellcasting: { ...Wizard2024.spellcasting!, spellSaveDC: () => 99, spellAttackBonus: () => 42 },
    };
    const info = getSpellcastingInfo(makeCharacter({ classes: [classLevel(customWizard, 1)] }))!;
    expect(info.spellSaveDC).toBe(99);
    expect(info.spellAttackBonus).toBe(42);
  });

  it.todo(
    "BUG: an Eldritch Knight / Arcane Trickster (Int casters via subclass) gets no spell save DC or attack bonus - getSpellcastingInfo only looks at class.spellcasting, which Fighter/Rogue lack"
  );
});
