import { describe, it, expect, vi } from "vitest";
import type { SpellDiceRoll, SpellMechanics } from "@/interfaces/Spell";
import {
  adjustExpendedSlots,
  cantripTier,
  castableLevels,
  describeUpcast,
  fallbackMechanics,
  formatScaledRoll,
  getScaledSpellRolls,
  remainingSlots,
  rollScaledSpellRoll,
  scaledRollLabel,
  scaleSpellRoll,
  spellCanUpcast,
  spellNameKey,
  SPELL_ROLE_LABELS,
  type ScaledSpellRoll,
  type SpellScaleContext,
} from "@/utils/spellRolls";
import { compendiumMechanics, compendiumSpell, diceRoll, makeSpell } from "../../tests/fixtures/spells";

/** Context for casting a cantrip at a given character level. */
const cantripAt = (characterLevel: number): SpellScaleContext => ({ spellLevel: 0, castLevel: 0, characterLevel });
/** Context for casting a `spellLevel` spell with a `castLevel` slot. */
const castWith = (spellLevel: number, castLevel: number, characterLevel = 20): SpellScaleContext => ({
  spellLevel,
  castLevel,
  characterLevel,
});

/** Scales the first damage/healing/effect roll of a real compendium spell. */
function scaleFirst(spellName: string, context: SpellScaleContext): ScaledSpellRoll | null {
  const mechanics = compendiumMechanics(spellName);
  const [kind, roll] = mechanics.damage?.[0]
    ? (["damage", mechanics.damage[0]] as const)
    : mechanics.healing?.[0]
      ? (["healing", mechanics.healing[0]] as const)
      : (["effect", mechanics.effects![0]] as const);
  return scaleSpellRoll(roll, kind, context);
}

describe("cantripTier", () => {
  it.each([
    [1, 1],
    [4, 1],
    [5, 2],
    [10, 2],
    [11, 3],
    [16, 3],
    [17, 4],
    [20, 4],
  ])("character level %i is cantrip tier %i", (level, tier) => {
    expect(cantripTier(level)).toBe(tier);
  });
});

describe("SPELL_ROLE_LABELS", () => {
  it("has a human-readable label for every role", () => {
    expect(SPELL_ROLE_LABELS.damage).toBe("Damage");
    expect(Object.keys(SPELL_ROLE_LABELS)).toHaveLength(8);
  });
});

describe("scaleSpellRoll", () => {
  describe("cantrips", () => {
    it.each([
      [1, "1d10", false],
      [4, "1d10", false],
      [5, "2d10", true],
      [11, "3d10", true],
      [17, "4d10", true],
    ])("Fire Bolt at character level %i rolls %s", (level, display, scaled) => {
      const roll = scaleFirst("Fire Bolt", cantripAt(level));
      expect(roll?.display).toBe(display);
      expect(roll?.scaled).toBe(scaled);
      expect(roll?.instances).toBe(1);
    });

    it("adds extra beams to Eldritch Blast instead of extra dice", () => {
      expect(scaleFirst("Eldritch Blast", cantripAt(1))?.display).toBe("1d10");
      const at5 = scaleFirst("Eldritch Blast", cantripAt(5));
      expect(at5?.instances).toBe(2);
      expect(at5?.display).toBe("2 × (1d10)");
      expect(scaleFirst("Eldritch Blast", cantripAt(17))?.instances).toBe(4);
    });

    it("returns null for a roll with no dice until the first cantrip upgrade (Booming Blade's on-hit rider)", () => {
      const onHit = compendiumMechanics("Booming Blade").damage![0];
      expect(scaleSpellRoll(onHit, "damage", cantripAt(4))).toBeNull();
      expect(scaleSpellRoll(onHit, "damage", cantripAt(5))?.display).toBe("1d8");
      expect(scaleSpellRoll(onHit, "damage", cantripAt(17))?.display).toBe("3d8");
    });

    it("ignores the slot level for cantrips", () => {
      const roll = scaleFirst("Fire Bolt", { spellLevel: 0, castLevel: 9, characterLevel: 1 });
      expect(roll?.display).toBe("1d10");
    });
  });

  describe("upcasting leveled spells", () => {
    it("rolls the base dice at the spell's own level", () => {
      const roll = scaleFirst("Fireball", castWith(3, 3));
      expect(roll?.display).toBe("8d6");
      expect(roll?.scaled).toBe(false);
      expect(roll?.kind).toBe("damage");
    });

    it("adds the upcast dice once per slot level above the spell's level", () => {
      const roll = scaleFirst("Fireball", castWith(3, 5));
      expect(roll?.display).toBe("10d6");
      expect(roll?.dice).toEqual({ groups: [{ count: 10, sides: 6 }], flat: 0 });
      expect(roll?.scaled).toBe(true);
    });

    it("ignores character level for leveled spells", () => {
      expect(scaleFirst("Fireball", castWith(3, 3, 1))?.display).toBe(scaleFirst("Fireball", castWith(3, 3, 20))?.display);
    });

    it("treats a slot below the spell's level as its own level (no negative upcast)", () => {
      expect(scaleFirst("Fireball", castWith(3, 1))?.display).toBe("8d6");
    });

    it("adds extra darts to Magic Missile per slot level", () => {
      const base = scaleFirst("Magic Missile", castWith(1, 1));
      expect(base?.instances).toBe(3);
      expect(base?.display).toBe("3 × (1d4 + 1)");
      const upcast = scaleFirst("Magic Missile", castWith(1, 3));
      expect(upcast?.instances).toBe(5);
      expect(upcast?.display).toBe("5 × (1d4 + 1)");
      expect(upcast?.scaled).toBe(true);
    });

    it.each([
      [2, "2d8"],
      [3, "3d8"],
      [4, "3d8"],
      [5, "4d8"],
      [6, "4d8"],
      [7, "5d8"],
      [9, "5d8"],
    ])("replaces Shadow Blade's dice with the tier for a level %i slot (%s)", (castLevel, display) => {
      expect(scaleFirst("Shadow Blade", castWith(2, castLevel))?.display).toBe(display);
    });

    it("only adds dice every N levels when upcastEvery is set", () => {
      const roll = diceRoll("1d8", { upcastDice: "1d8", upcastEvery: 2 });
      expect(scaleSpellRoll(roll, "damage", castWith(2, 3))?.display).toBe("1d8");
      expect(scaleSpellRoll(roll, "damage", castWith(2, 3))?.scaled).toBe(false);
      expect(scaleSpellRoll(roll, "damage", castWith(2, 4))?.display).toBe("2d8");
      expect(scaleSpellRoll(roll, "damage", castWith(2, 7))?.display).toBe("3d8");
    });

    it("merges upcast dice of a different size into a separate group", () => {
      const roll = diceRoll("2d8", { upcastDice: "1d6" });
      expect(scaleSpellRoll(roll, "damage", castWith(1, 3))?.display).toBe("2d8 + 2d6");
    });
  });

  describe("spellcasting modifier", () => {
    it("shows '+ mod' for rolls that add the spellcasting modifier", () => {
      expect(scaleFirst("Cure Wounds", castWith(1, 1))?.display).toBe("2d8 + mod");
      expect(scaleFirst("Cure Wounds", castWith(1, 2))?.display).toBe("4d8 + mod");
      expect(scaleFirst("Cure Wounds", castWith(1, 1))?.kind).toBe("healing");
    });

    it("keeps a modifier-only roll (Heroism's temp HP) instead of dropping it", () => {
      const roll = scaleFirst("Heroism", castWith(1, 1));
      expect(roll?.display).toBe("mod");
      expect(roll?.kind).toBe("effect");
    });
  });

  it("returns null for a roll with nothing to roll and no modifier", () => {
    expect(scaleSpellRoll(diceRoll(""), "effect", castWith(1, 1))).toBeNull();
  });

  it("keeps a flat, dice-less amount", () => {
    expect(scaleSpellRoll(diceRoll("70"), "healing", castWith(6, 6))?.display).toBe("70");
  });
});

describe("getScaledSpellRolls", () => {
  it("returns nothing for a spell without mechanics", () => {
    expect(getScaledSpellRolls(undefined, castWith(1, 1))).toEqual([]);
  });

  it("orders rolls damage, then healing, then effects", () => {
    const mechanics: SpellMechanics = {
      roles: ["damage"],
      effects: [diceRoll("1d4", { label: "Effect" })],
      healing: [diceRoll("1d6", { label: "Heal" })],
      damage: [diceRoll("1d8", { label: "Hurt" })],
    };
    const rolls = getScaledSpellRolls(mechanics, castWith(1, 1));
    expect(rolls.map((roll) => [roll.kind, roll.source.label])).toEqual([
      ["damage", "Hurt"],
      ["healing", "Heal"],
      ["effect", "Effect"],
    ]);
  });

  it("skips rolls that have nothing to roll yet", () => {
    const mechanics = compendiumMechanics("Booming Blade");
    expect(getScaledSpellRolls(mechanics, cantripAt(1)).map((roll) => roll.source.label)).toEqual(["If target moves"]);
    expect(getScaledSpellRolls(mechanics, cantripAt(5))).toHaveLength(2);
  });
});

describe("scaledRollLabel", () => {
  const scaled = (roll: SpellDiceRoll, kind: ScaledSpellRoll["kind"]) => scaleSpellRoll(roll, kind, castWith(1, 1))!;

  it("prefers the roll's own label", () => {
    expect(scaledRollLabel(scaled(diceRoll("1d4", { label: "Per dart" }), "damage"))).toBe("Per dart");
  });

  it("falls back to a label based on the kind of roll", () => {
    expect(scaledRollLabel(scaled(diceRoll("1d4"), "damage"))).toBe("Damage");
    expect(scaledRollLabel(scaled(diceRoll("1d4"), "healing"))).toBe("Healing");
    expect(scaledRollLabel(scaled(diceRoll("1d4"), "effect"))).toBe("Roll");
  });
});

describe("formatScaledRoll", () => {
  it("substitutes the actual modifier into '+ mod'", () => {
    const roll = scaleFirst("Cure Wounds", castWith(1, 1))!;
    expect(formatScaledRoll(roll, 3)).toBe("2d8 + 3");
    expect(formatScaledRoll(roll, -1)).toBe("2d8 - 1");
  });

  it("leaves '+ mod' in place when there is no character to read a modifier from", () => {
    expect(formatScaledRoll(scaleFirst("Cure Wounds", castWith(1, 1))!, null)).toBe("2d8 + mod");
  });

  it("shows a modifier-only roll as just the number (or 0)", () => {
    const heroism = scaleFirst("Heroism", castWith(1, 1))!;
    expect(formatScaledRoll(heroism, 4)).toBe("4");
    expect(formatScaledRoll(heroism, 0)).toBe("0");
  });

  it("does not add a modifier to rolls that don't use one", () => {
    expect(formatScaledRoll(scaleFirst("Magic Missile", castWith(1, 1))!, 5)).toBe("3 × (1d4 + 1)");
  });

  it("applies the modifier inside each instance", () => {
    const roll = scaleSpellRoll(diceRoll("1d4", { count: 2, addModifier: true }), "damage", castWith(1, 1))!;
    expect(formatScaledRoll(roll, 3)).toBe("2 × (1d4 + 3)");
  });
});

describe("rollScaledSpellRoll", () => {
  it("rolls the dice and adds the spellcasting modifier", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5); // every die shows floor(0.5 * 8) + 1 = 5
    const result = rollScaledSpellRoll(scaleFirst("Cure Wounds", castWith(1, 1))!, 3);
    expect(result).toEqual({ formula: "2d8 + 3", rolls: [5, 5], diceTotal: 10, modifier: 3, total: 13 });
  });

  it("rolls every instance separately, with the flat bonus per instance", () => {
    vi.spyOn(Math, "random").mockReturnValueOnce(0).mockReturnValueOnce(0.99).mockReturnValueOnce(0.5);
    const result = rollScaledSpellRoll(scaleFirst("Magic Missile", castWith(1, 1))!, 5);
    expect(result.rolls).toEqual([1, 4, 3]);
    expect(result.modifier).toBe(3); // +1 per dart, the ability modifier is not used
    expect(result.total).toBe(11);
  });

  it("totals a modifier-only roll without rolling any dice", () => {
    const random = vi.spyOn(Math, "random");
    const result = rollScaledSpellRoll(scaleFirst("Heroism", castWith(1, 1))!, 4);
    expect(random).not.toHaveBeenCalled();
    expect(result.rolls).toEqual([]);
    expect(result.total).toBe(4);
  });
});

describe("describeUpcast", () => {
  it("returns nothing for missing mechanics", () => {
    expect(describeUpcast(undefined)).toEqual([]);
  });

  it("describes per-level extra dice", () => {
    expect(describeUpcast(compendiumMechanics("Fireball"))).toEqual(["+1d6 per slot level"]);
  });

  it("describes 'every two slot levels' scaling", () => {
    expect(describeUpcast({ roles: ["damage"], damage: [diceRoll("1d8", { upcastDice: "1d8", upcastEvery: 2 })] })).toEqual([
      "+1d8 per 2 slot levels",
    ]);
  });

  it("describes extra instances", () => {
    expect(describeUpcast({ roles: ["damage"], damage: [diceRoll("1d4", { upcastCount: 1 })] })).toEqual(["+1 roll per slot level"]);
    expect(describeUpcast(compendiumMechanics("Magic Missile"))[0]).toMatch(/^\+1 .*dart per slot level$/);
  });

  it("includes the roll's label when there is one", () => {
    expect(describeUpcast({ roles: ["damage"], damage: [diceRoll("2d6", { label: "Initial", upcastDice: "1d6" })] })).toEqual([
      "+1d6 initial per slot level",
    ]);
  });

  it("lists tiered replacements", () => {
    expect(describeUpcast(compendiumMechanics("Shadow Blade"))).toEqual(["3d8 at 3+, 4d8 at 5+, 5d8 at 7+"]);
  });
});

describe("spellCanUpcast", () => {
  it("is never true for cantrips", () => {
    expect(spellCanUpcast(compendiumSpell("Fire Bolt"), compendiumMechanics("Fire Bolt"))).toBe(false);
  });

  it("is true when any roll scales with slot level", () => {
    expect(spellCanUpcast(compendiumSpell("Fireball"), compendiumMechanics("Fireball"))).toBe(true);
    expect(spellCanUpcast(compendiumSpell("Magic Missile"), compendiumMechanics("Magic Missile"))).toBe(true);
    expect(spellCanUpcast(compendiumSpell("Shadow Blade"), compendiumMechanics("Shadow Blade"))).toBe(true);
  });

  it("is true for a written-only upcast note (Heroism's extra targets)", () => {
    expect(spellCanUpcast(compendiumSpell("Heroism"), compendiumMechanics("Heroism"))).toBe(true);
  });

  it("is false when the mechanics have nothing that scales", () => {
    const spell = makeSpell({ description: "At Higher Levels. Something happens." });
    expect(spellCanUpcast(spell, { roles: ["utility"], effects: [diceRoll("1d4")] })).toBe(false);
  });

  it("falls back to the description text when there are no mechanics", () => {
    expect(spellCanUpcast(makeSpell({ description: "Boom.\n\nUsing a Higher-Level Spell Slot. More boom." }), undefined)).toBe(true);
    expect(spellCanUpcast(makeSpell({ description: "Boom.\n\nAt Higher Levels. More boom." }), undefined)).toBe(true);
    expect(spellCanUpcast(makeSpell({ description: "Boom." }), undefined)).toBe(false);
  });
});

describe("fallbackMechanics", () => {
  it("is plain utility when the description has no dice", () => {
    expect(fallbackMechanics(makeSpell({ description: "You glow softly." }))).toEqual({ roles: ["utility"] });
  });

  it("treats dice followed by 'damage' as a damage roll", () => {
    const mechanics = fallbackMechanics(makeSpell({ description: "A bolt hits the target for 3d6 fire damage." }));
    expect(mechanics.roles).toEqual(["damage"]);
    expect(mechanics.damage).toEqual([{ label: undefined, dice: "3d6" }]);
    expect(mechanics.effects).toBeUndefined();
  });

  it("recognises damage dice written with a flat bonus and spaces", () => {
    const mechanics = fallbackMechanics(makeSpell({ description: "Each dart deals 1d4 + 1 force damage." }));
    expect(mechanics.damage?.[0].dice).toBe("1d4+1");
  });

  it("treats other dice as a labelled utility roll", () => {
    const mechanics = fallbackMechanics(makeSpell({ description: "Roll 1d4 and add it to the check." }));
    expect(mechanics).toEqual({ roles: ["utility"], effects: [{ label: "Dice in text", dice: "1d4" }] });
  });

  it("reads per-slot-level upcast dice from 2014 'At Higher Levels' text", () => {
    const spell = makeSpell({
      level: 2,
      description:
        "A shard deals 2d8 cold damage.\n\nAt Higher Levels. When you cast this spell using a spell slot of 3rd level or higher, the damage increases by 1d8 for each slot level above 2nd.",
    });
    expect(fallbackMechanics(spell).damage?.[0]).toMatchObject({ dice: "2d8", upcastDice: "1d8" });
    expect(fallbackMechanics(spell).damage?.[0].upcastEvery).toBeUndefined();
  });

  it("reads 2024 'Using a Higher-Level Spell Slot' text", () => {
    const spell = makeSpell({
      description: "Deals 1d10 necrotic damage.\n\nUsing a Higher-Level Spell Slot. The damage increases by 1d10 for each spell slot level above 1.",
    });
    expect(fallbackMechanics(spell).damage?.[0].upcastDice).toBe("1d10");
  });

  it("recognises 'every two slot levels' wording", () => {
    const spell = makeSpell({
      level: 2,
      description: "Deals 1d8 force damage.\n\nAt Higher Levels. The damage increases by 1d8 for every two slot levels above 2nd.",
    });
    expect(fallbackMechanics(spell).damage?.[0]).toMatchObject({ upcastDice: "1d8", upcastEvery: 2 });
  });

  it("reads cantrip upgrade dice and never adds upcast dice to a cantrip", () => {
    const spell = makeSpell({
      level: 0,
      description:
        "A flame deals 1d8 radiant damage.\n\nCantrip Upgrade. The damage increases by 1d8 when you reach levels 5 (2d8), 11 (3d8), and 17 (4d8).",
    });
    const roll = fallbackMechanics(spell).damage?.[0];
    expect(roll).toMatchObject({ dice: "1d8", cantripDice: "1d8" });
    expect(roll?.upcastDice).toBeUndefined();
  });

  it("produces mechanics that scaleSpellRoll can upcast", () => {
    const spell = makeSpell({
      description: "Deals 2d6 acid damage.\n\nAt Higher Levels. The damage increases by 1d6 for each slot level above 1st.",
    });
    const [roll] = getScaledSpellRolls(fallbackMechanics(spell), castWith(1, 3));
    expect(roll.display).toBe("4d6");
  });
});

describe("spellNameKey", () => {
  it("ignores case, curly apostrophes and extra whitespace", () => {
    expect(spellNameKey("Hunter’s Mark")).toBe("hunter's mark");
    expect(spellNameKey("  Magic   Missile ")).toBe("magic missile");
    expect(spellNameKey("Tasha`s Hideous Laughter")).toBe(spellNameKey("tasha's hideous laughter"));
  });
});

describe("remainingSlots", () => {
  it("returns nothing when there is no slot table", () => {
    expect(remainingSlots(null, { 1: 1 })).toEqual({});
  });

  it("subtracts expended slots from the maximum, per level", () => {
    expect(remainingSlots({ 1: 4, 2: 3 }, { 1: 1 })).toEqual({ 1: 3, 2: 3 });
    expect(remainingSlots({ 1: 4, 2: 3 }, undefined)).toEqual({ 1: 4, 2: 3 });
  });

  it("never goes below zero, and skips levels with no slots at all", () => {
    expect(remainingSlots({ 1: 2, 2: 0 }, { 1: 5 })).toEqual({ 1: 0 });
  });
});

describe("adjustExpendedSlots", () => {
  it("expends a slot from the shared pool", () => {
    expect(adjustExpendedSlots(undefined, "spell", 1, 1, { 1: 2 })).toEqual({ expendedSpellSlots: { 1: 1 } });
  });

  it("writes Pact Magic to its own field", () => {
    expect(adjustExpendedSlots({ expendedPactSlots: { 3: 1 } }, "pact", 3, 1, { 3: 2 })).toEqual({ expendedPactSlots: { 3: 2 } });
  });

  it("can't expend more slots than the level has", () => {
    expect(adjustExpendedSlots({ expendedSpellSlots: { 1: 2 } }, "spell", 1, 1, { 1: 2 })).toEqual({ expendedSpellSlots: { 1: 2 } });
    expect(adjustExpendedSlots(undefined, "spell", 4, 1, { 1: 2 })).toEqual({ expendedSpellSlots: {} });
  });

  it("removes a level from the record once it's fully restored", () => {
    expect(adjustExpendedSlots({ expendedSpellSlots: { 1: 1, 2: 1 } }, "spell", 1, -1, { 1: 4, 2: 3 })).toEqual({
      expendedSpellSlots: { 2: 1 },
    });
    expect(adjustExpendedSlots(undefined, "spell", 1, -1, { 1: 4 })).toEqual({ expendedSpellSlots: {} });
  });

  it("does not mutate the existing details", () => {
    const details = { expendedSpellSlots: { 1: 1 } };
    adjustExpendedSlots(details, "spell", 1, 1, { 1: 4 });
    expect(details).toEqual({ expendedSpellSlots: { 1: 1 } });
  });
});

describe("castableLevels", () => {
  it("lists every level at or above the spell's level that still has a slot, across both pools", () => {
    expect(castableLevels(2, { 1: 2, 2: 0, 3: 1 }, { 3: 2, 5: 1 })).toEqual([3, 5]);
  });

  it("returns nothing when every slot is spent", () => {
    expect(castableLevels(1, { 1: 0, 2: 0 }, {})).toEqual([]);
  });

  it("sorts numerically", () => {
    expect(castableLevels(1, { 9: 1, 10: 1, 2: 1 }, {})).toEqual([2, 9, 10]);
  });
});
