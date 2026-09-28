import { describe, it, expect } from "vitest";
import type { FeatureChoice } from "@/interfaces/CharacterClass";
import {
  areFeatureChoicesComplete,
  decodeFeatureChoiceSelection,
  encodeFeatureChoiceSelection,
  featureChoiceKey,
  featureChoiceMaxSelections,
  getAutoGrantedSpellNames,
  getBonusSpellCaps,
  getFeatureChoices,
  pruneFeatureChoices,
  resolveSpellsByName,
  type GrantEntryInput,
} from "@/utils/grantedSpells";
import { Warlock as Warlock2024 } from "@/data/2024/classes/Warlock";
import { Warlock as Warlock2014 } from "@/data/2014/classes/Warlock";
import { Fighter as Fighter2024 } from "@/data/2024/classes/Fighter";
import { FighterSubclasses as FighterSubclasses2024 } from "@/data/2024/subclasses/Fighter";
import { feature, makeClass, makeSpell, makeSubclass } from "../../tests/fixtures/spells";

const PsiWarrior2024 = FighterSubclasses2024.find((subclass) => subclass.name === "Psi Warrior")!;

const pactChoice: FeatureChoice = {
  key: "pact",
  prompt: "Choose a pact",
  options: [
    { id: "tome", label: "Tome", grantedSpells: [{ choice: { count: 3, spellLevel: 0 } }] },
    { id: "chain", label: "Chain", grantedSpells: [{ spellName: "Find Familiar" }] },
    { id: "blade", label: "Blade" },
  ],
};

const invocationChoice: FeatureChoice = {
  key: "inv",
  prompt: "Choose invocations",
  countByLevel: { 2: 2, 5: 3 },
  options: [
    { id: "armor", label: "Armor of Shadows", grantedSpells: [{ spellName: "Mage Armor" }] },
    { id: "sight", label: "Devil's Sight" },
    { id: "leap", label: "Otherworldly Leap", grantedSpells: [{ spellName: "Jump", atLevel: 9 }] },
    { id: "mask", label: "Mask", grantedSpells: [{ spellName: "Disguise Self" }] },
  ],
};

/** A small synthetic caster: a fixed grant at 1, a pact choice at 3, invocations from 2, Arcanum at 11, and a terrain-style progressive grant. */
const Testlock = makeClass({
  name: "Testlock",
  features: [
    feature("Innate Light", 1, { grantedSpells: [{ spellName: "Light" }] }),
    feature("Invocations", 2, { choice: invocationChoice }),
    feature("Pact Boon", 3, { choice: pactChoice }),
    feature("Circle Spells", 3, { grantedSpells: [{ spellName: "Hold Person", atLevel: 3 }, { spellName: "Fireball", atLevel: 5 }] }),
    feature("Arcanum", 11, { grantedSpells: [{ choice: { count: 1, spellLevel: 6 } }] }),
  ],
});

const at = (level: number, extra: Partial<GrantEntryInput> = {}): GrantEntryInput => ({ characterClass: Testlock, level, ...extra });

const PACT_KEY = "0:Pact Boon:pact";
const INV_KEY = "0:Invocations:inv";

describe("featureChoiceKey", () => {
  it("combines class index, feature name and choice key", () => {
    expect(featureChoiceKey(0, feature("Pact Boon", 3, { choice: pactChoice }))).toBe("0:Pact Boon:pact");
    expect(featureChoiceKey(2, feature("Pact Boon", 3, { choice: pactChoice }))).toBe("2:Pact Boon:pact");
  });

  it("leaves the choice part empty for a feature without a choice", () => {
    expect(featureChoiceKey(1, feature("Second Wind", 1))).toBe("1:Second Wind:");
  });
});

describe("featureChoiceMaxSelections", () => {
  it("is 1 for an ordinary single-select choice", () => {
    expect(featureChoiceMaxSelections(pactChoice, 20)).toBe(1);
  });

  it("uses the highest threshold reached for a multi-select choice", () => {
    expect(featureChoiceMaxSelections(invocationChoice, 2)).toBe(2);
    expect(featureChoiceMaxSelections(invocationChoice, 4)).toBe(2);
    expect(featureChoiceMaxSelections(invocationChoice, 5)).toBe(3);
    expect(featureChoiceMaxSelections(invocationChoice, 20)).toBe(3);
  });

  it("is 0 below the lowest threshold", () => {
    expect(featureChoiceMaxSelections(invocationChoice, 1)).toBe(0);
  });

  it("matches the real Eldritch Invocations tables", () => {
    const inv2024 = Warlock2024.features.find((f) => f.name === "Eldritch Invocations")!.choice!;
    expect([1, 2, 5, 7, 9, 12, 15, 18].map((level) => featureChoiceMaxSelections(inv2024, level))).toEqual([1, 3, 5, 6, 7, 8, 9, 10]);
    const inv2014 = Warlock2014.features.find((f) => f.name === "Eldritch Invocations")!.choice!;
    expect([2, 5, 7, 9, 12, 15, 18].map((level) => featureChoiceMaxSelections(inv2014, level))).toEqual([2, 3, 4, 5, 6, 7, 8]);
  });
});

describe("encode/decodeFeatureChoiceSelection", () => {
  it("decodes an unresolved choice to an empty list", () => {
    expect(decodeFeatureChoiceSelection(undefined)).toEqual([]);
    expect(decodeFeatureChoiceSelection("")).toEqual([]);
  });

  it("decodes a single id and a comma-joined list", () => {
    expect(decodeFeatureChoiceSelection("tome")).toEqual(["tome"]);
    expect(decodeFeatureChoiceSelection("a,b,,c")).toEqual(["a", "b", "c"]);
  });

  it("round-trips, and a single pick encodes to the bare id", () => {
    expect(encodeFeatureChoiceSelection(["tome"])).toBe("tome");
    expect(decodeFeatureChoiceSelection(encodeFeatureChoiceSelection(["a", "b"]))).toEqual(["a", "b"]);
  });
});

describe("getFeatureChoices", () => {
  it("lists only choices reached at the entry's level", () => {
    expect(getFeatureChoices([at(1)])).toEqual([]);
    expect(getFeatureChoices([at(2)]).map((choice) => choice.key)).toEqual([INV_KEY]);
    expect(getFeatureChoices([at(3)]).map((choice) => choice.key)).toEqual([INV_KEY, PACT_KEY]);
  });

  it("describes each pending choice", () => {
    const [invocations] = getFeatureChoices([at(5)]);
    expect(invocations).toEqual({
      key: INV_KEY,
      classIndex: 0,
      className: "Testlock",
      featureName: "Invocations",
      level: 2,
      choice: invocationChoice,
      maxSelections: 3,
    });
  });

  it("includes subclass features, keyed by the class's position", () => {
    const subclass = makeSubclass({ features: [feature("Subclass Pick", 3, { choice: { ...pactChoice, key: "sub" } })] });
    const choices = getFeatureChoices([{ characterClass: makeClass(), level: 1 }, { characterClass: makeClass(), subclass, level: 3 }]);
    expect(choices.map((choice) => choice.key)).toEqual(["1:Subclass Pick:sub"]);
  });

  it("falls back to the subclass's parent class name when no class is set", () => {
    const subclass = makeSubclass({ parentClass: "Parent", features: [feature("Pick", 1, { choice: pactChoice })] });
    expect(getFeatureChoices([{ subclass, level: 1 }])[0].className).toBe("Parent");
  });

  it("skips empty draft rows", () => {
    expect(getFeatureChoices([{ level: 5 }])).toEqual([]);
  });

  it("finds the real 2024 Fighter's Fighting Style choice", () => {
    expect(getFeatureChoices([{ characterClass: Fighter2024, level: 1 }]).map((choice) => choice.key)).toEqual(["0:Fighting Style:fightingStyle"]);
  });
});

describe("areFeatureChoicesComplete", () => {
  it("is true when nothing needs choosing", () => {
    expect(areFeatureChoicesComplete([at(1)], {})).toBe(true);
  });

  it("requires every reached choice to be resolved", () => {
    expect(areFeatureChoicesComplete([at(3)], { [INV_KEY]: "armor,sight" })).toBe(false);
    expect(areFeatureChoicesComplete([at(3)], { [INV_KEY]: "armor,sight", [PACT_KEY]: "tome" })).toBe(true);
  });

  it("requires exactly the allowed number of picks for a multi-select choice", () => {
    expect(areFeatureChoicesComplete([at(2)], { [INV_KEY]: "armor" })).toBe(false);
    expect(areFeatureChoicesComplete([at(2)], { [INV_KEY]: "armor,sight" })).toBe(true);
    expect(areFeatureChoicesComplete([at(2)], { [INV_KEY]: "armor,sight,mask" })).toBe(false);
  });
});

describe("pruneFeatureChoices", () => {
  it("keeps valid picks untouched", () => {
    const choices = { [INV_KEY]: "armor,sight", [PACT_KEY]: "tome" };
    expect(pruneFeatureChoices([at(3)], choices)).toEqual(choices);
  });

  it("drops choices that are no longer reached (level dropped, class swapped)", () => {
    expect(pruneFeatureChoices([at(2)], { [INV_KEY]: "armor,sight", [PACT_KEY]: "tome" })).toEqual({ [INV_KEY]: "armor,sight" });
    expect(pruneFeatureChoices([{ characterClass: Fighter2024, level: 1 }], { [PACT_KEY]: "tome" })).toEqual({});
  });

  it("drops ids that are no longer options, and removes the entry if nothing is left", () => {
    expect(pruneFeatureChoices([at(3)], { [INV_KEY]: "bogus,armor", [PACT_KEY]: "bogus" })).toEqual({ [INV_KEY]: "armor" });
  });

  it("trims a multi-select choice down to the new cap, keeping the first picks", () => {
    expect(pruneFeatureChoices([at(4)], { [INV_KEY]: "mask,armor,sight" })).toEqual({ [INV_KEY]: "mask,armor" });
  });
});

describe("getAutoGrantedSpellNames", () => {
  it("includes unconditional grants once their feature is reached", () => {
    expect(getAutoGrantedSpellNames([at(1)])).toEqual(["Light"]);
  });

  it("honors a grant's own atLevel over its feature's level", () => {
    expect(getAutoGrantedSpellNames([at(3)])).toEqual(["Light", "Hold Person"]);
    expect(getAutoGrantedSpellNames([at(5)])).toEqual(["Light", "Hold Person", "Fireball"]);
  });

  it("includes fixed spells from resolved choices only", () => {
    expect(getAutoGrantedSpellNames([at(3)], { [PACT_KEY]: "chain" })).toContain("Find Familiar");
    expect(getAutoGrantedSpellNames([at(3)], { [PACT_KEY]: "tome" })).not.toContain("Find Familiar");
    expect(getAutoGrantedSpellNames([at(3)])).not.toContain("Find Familiar");
  });

  it("includes every selected option of a multi-select choice, each gated by its own atLevel", () => {
    const choices = { [INV_KEY]: "armor,leap,mask" };
    expect(getAutoGrantedSpellNames([at(5)], choices)).toEqual(expect.arrayContaining(["Mage Armor", "Disguise Self"]));
    expect(getAutoGrantedSpellNames([at(5)], choices)).not.toContain("Jump");
    expect(getAutoGrantedSpellNames([at(9)], choices)).toContain("Jump");
  });

  it("dedupes a spell granted by two classes", () => {
    expect(getAutoGrantedSpellNames([at(1), at(1)])).toEqual(["Light"]);
  });

  it("finds real subclass grants (Psi Warrior's Telekinesis at 18)", () => {
    expect(getAutoGrantedSpellNames([{ characterClass: Fighter2024, subclass: PsiWarrior2024, level: 17 }])).not.toContain("Telekinesis");
    expect(getAutoGrantedSpellNames([{ characterClass: Fighter2024, subclass: PsiWarrior2024, level: 18 }])).toContain("Telekinesis");
  });

  it("finds real invocation grants (2024 Armor of Shadows)", () => {
    const names = getAutoGrantedSpellNames([{ characterClass: Warlock2024, level: 1 }], { "0:Eldritch Invocations:invocations": "armor-of-shadows" });
    expect(names).toContain("Mage Armor");
  });
});

describe("resolveSpellsByName", () => {
  const spells = [makeSpell({ name: "Light", level: 0 }), makeSpell({ name: "Fireball", level: 3 })];

  it("returns matching spells in the requested order", () => {
    expect(resolveSpellsByName(["Fireball", "Light"], spells).map((spell) => spell.name)).toEqual(["Fireball", "Light"]);
  });

  it("silently drops names that aren't found", () => {
    expect(resolveSpellsByName(["Light", "Not A Spell"], spells).map((spell) => spell.name)).toEqual(["Light"]);
    expect(resolveSpellsByName([], spells)).toEqual([]);
  });
});

describe("getBonusSpellCaps", () => {
  it("is empty when no choice-type grants are reached", () => {
    expect(getBonusSpellCaps([at(10)])).toEqual({ cantrips: 0, leveled: 0, extraLevels: [] });
  });

  it("adds leveled spells and unlocks their level for an unconditional choice grant (Mystic Arcanum)", () => {
    expect(getBonusSpellCaps([at(11)])).toEqual({ cantrips: 0, leveled: 1, extraLevels: [6] });
  });

  it("adds cantrips from a resolved choice (Pact of the Tome)", () => {
    expect(getBonusSpellCaps([at(3)], { [PACT_KEY]: "tome" })).toEqual({ cantrips: 3, leveled: 0, extraLevels: [0] });
    expect(getBonusSpellCaps([at(3)], { [PACT_KEY]: "chain" })).toEqual({ cantrips: 0, leveled: 0, extraLevels: [] });
  });

  it("sums the real 2024 Warlock's arcanums and Pact of the Tome", () => {
    const caps = getBonusSpellCaps([{ characterClass: Warlock2024, level: 17 }], { "0:Eldritch Invocations:invocations": "pact-of-the-tome" });
    expect(caps.cantrips).toBe(3);
    expect(caps.leveled).toBe(4 + 2);
    expect([...caps.extraLevels].sort()).toEqual([0, 1, 6, 7, 8, 9]);
  });
});
