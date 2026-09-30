import { describe, it, expect } from "vitest";
import { buildRoll20Export, buildRoll20HpUpdate, ROLL20_EXPORT_VERSION } from "./roll20Export";
import { armor, classLevel, makeCharacter, weapon } from "../../../tests/fixtures/characters";
import { compendiumSpell } from "../../../tests/fixtures/spells";
import { Fighter as Fighter2024 } from "@/data/2024/classes/Fighter";
import { Wizard as Wizard2024 } from "@/data/2024/classes/Wizard";
import type { Character } from "@/interfaces/Characters";

const withId = (character: Character, id = "sheet-1") => ({ ...character, id });

describe("buildRoll20Export", () => {
  it("flattens abilities, saves and skills into final numbers", () => {
    const character = withId(
      makeCharacter({
        classes: [classLevel(Fighter2024, 5)],
        abilityScores: { strength: 16, dexterity: 14, constitution: 12, intelligence: 8, wisdom: 13, charisma: 10 },
        savingThrowProficiencies: ["strength", "constitution"],
        skillProficiencies: ["Athletics", "Perception"],
      })
    );
    const out = buildRoll20Export(character);

    expect(out.version).toBe(ROLL20_EXPORT_VERSION);
    expect(out.sheetCharacterId).toBe("sheet-1");
    expect(out.level).toBe(5);
    expect(out.proficiencyBonus).toBe(3);
    expect(out.abilities.strength).toEqual({ score: 16, mod: 3, saveProficient: true, save: 6 });
    expect(out.abilities.dexterity).toEqual({ score: 14, mod: 2, saveProficient: false, save: 2 });
    expect(out.skills).toHaveLength(18);
    expect(out.skills.find((skill) => skill.name === "Athletics")).toMatchObject({ proficient: true, bonus: 6 });
    expect(out.skills.find((skill) => skill.name === "Stealth")).toMatchObject({ proficient: false, bonus: 2 });
    expect(out.passive.perception).toBe(14);
    expect(out.initiative).toBe(2);
  });

  it("exports weapon attacks with ready-to-roll damage, plus Unarmed Strike first", () => {
    const character = withId(
      makeCharacter({
        abilityScores: { strength: 16, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
        weapons: [weapon("Longsword")],
      })
    );
    const out = buildRoll20Export(character);

    expect(out.attacks[0].isUnarmedStrike).toBe(true);
    const longsword = out.attacks.find((attack) => attack.name === "Longsword")!;
    expect(longsword).toMatchObject({ type: "melee", ability: "strength", proficient: true, attackBonus: 5 });
    expect(longsword.damage).toBe(`${longsword.damageDice}+3`);
    expect(longsword.versatileDamage).toMatch(/\+3$/);
    expect(out.inventory.some((item) => item.name === "Longsword")).toBe(true);
  });

  it("reports worn armor in AC and inventory", () => {
    const character = withId(makeCharacter({ armors: [{ ...armor("Chain Mail"), equipped: true }] }));
    const out = buildRoll20Export(character);
    expect(out.armorClass).toBe(16);
    expect(out.armorWorn).toBe("Chain Mail");
    expect(out.inventory.find((item) => item.name === "Chain Mail")).toMatchObject({ equipped: true });
  });

  it("exports spellcasting numbers, slots with expended counts, and spell rolls", () => {
    const character = withId(
      makeCharacter({
        classes: [classLevel(Wizard2024, 3)],
        abilityScores: { strength: 8, dexterity: 14, constitution: 12, intelligence: 16, wisdom: 10, charisma: 10 },
        spellsKnown: [compendiumSpell("Fire Bolt"), compendiumSpell("Magic Missile")],
        details: { expendedSpellSlots: { 1: 2 } },
      })
    );
    const out = buildRoll20Export(character);

    expect(out.spellcasting).toMatchObject({ ability: "intelligence", abilityMod: 3, attackBonus: 5, saveDC: 13 });
    expect(out.spellSlots).toEqual([
      { level: 1, max: 4, expended: 2 },
      { level: 2, max: 2, expended: 0 },
    ]);
    const fireBolt = out.spells.find((spell) => spell.name === "Fire Bolt")!;
    expect(fireBolt.level).toBe(0);
    expect(fireBolt.attack).toBe("ranged");
    expect(fireBolt.rolls[0]).toMatchObject({ kind: "damage", formula: "1d10" });
    expect(out.spells.map((spell) => spell.name)).toEqual(["Fire Bolt", "Magic Missile"]);
  });

  it("includes unlocked class features only, plus species traits and feats", () => {
    const character = withId(makeCharacter({ classes: [classLevel(Fighter2024, 1)] }));
    const out = buildRoll20Export(character);
    const classFeatures = out.features.filter((feature) => feature.source === "class");
    expect(classFeatures.length).toBeGreaterThan(0);
    expect(classFeatures.every((feature) => (feature.level ?? 0) <= 1)).toBe(true);
    expect(out.features.some((feature) => feature.source === "species")).toBe(true);
  });

  it("maps currency, trackers and details", () => {
    const character = withId(
      makeCharacter({
        currency: { copper: 1, silver: 2, electrum: 3, gold: 4, platinum: 5 },
        details: {
          inspiration: true,
          deathSaves: { successes: 1, failures: 2 },
          conditions: ["Poisoned"],
          exhaustionLevel: 1,
          flavor: { ideals: "Glory" },
          appearance: { eyes: "Green" },
          backstory: "Once upon a time",
        },
      })
    );
    const out = buildRoll20Export(character);
    expect(out.currency).toEqual({ cp: 1, sp: 2, ep: 3, gp: 4, pp: 5 });
    expect(out.trackers).toMatchObject({ inspiration: true, deathSaves: { successes: 1, failures: 2 }, conditions: ["Poisoned"], exhaustion: 1 });
    expect(out.details).toMatchObject({ ideals: "Glory", eyes: "Green", backstory: "Once upon a time" });
  });

  it("survives a JSON round trip (it is sent through postMessage and chrome messaging)", () => {
    const character = withId(makeCharacter({ weapons: [weapon("Longsword")] }));
    const out = buildRoll20Export(character);
    expect(JSON.parse(JSON.stringify(out))).toEqual(JSON.parse(JSON.stringify(out)));
    expect(() => structuredClone(out)).not.toThrow();
  });
});

describe("buildRoll20HpUpdate", () => {
  it("sends current HP and the sheet's computed max", () => {
    const character = withId(makeCharacter({ currentHP: 7, classes: [classLevel(Fighter2024, 1)] }), "abc");
    const update = buildRoll20HpUpdate(character);
    expect(update).toMatchObject({ sheetCharacterId: "abc", name: "Testy McTestface", current: 7 });
    expect(update.max).toBeGreaterThanOrEqual(10);
  });
});
