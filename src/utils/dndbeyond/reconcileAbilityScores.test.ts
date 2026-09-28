import { describe, it, expect } from "vitest";
import type { AbilityScores } from "@/interfaces/Characters";
import type { Background } from "@/interfaces/Background";
import type { AsiSlot } from "@/utils/abilityScoreImprovements";
import {
  backgroundAllocationCandidates,
  formatAbilityBonuses,
  reconcileAbilityScores,
  type AbilityScoreReconciliationInput,
} from "@/utils/dndbeyond/reconcileAbilityScores";

const scores = (overrides: Partial<AbilityScores> = {}): AbilityScores => ({
  strength: 10,
  dexterity: 10,
  constitution: 10,
  intelligence: 10,
  wisdom: 10,
  charisma: 10,
  ...overrides,
});

const background = (abilityScoreOptions?: Background["abilityScoreOptions"]): Background => ({
  name: "Test Background",
  edition: abilityScoreOptions ? "2024" : "2014",
  abilityScoreOptions,
  skillProficiencies: [],
  equipment: [],
});

/** 2014-style background: no ability allocation at all. */
const NO_ALLOCATION = background();
/** 2024 Soldier-style: +2/+1 among STR/DEX/CON. */
const PHYSICAL_2_1 = background({ from: ["strength", "dexterity", "constitution"], allocation: "2-1" });
const PHYSICAL_1_1_1 = background({ from: ["strength", "dexterity", "constitution"], allocation: "1-1-1" });

const slot = (level: number, classIndex = 0): AsiSlot => ({ key: `${classIndex}:${level}`, classIndex, className: "Fighter", level });

/** Reconcile with base 10s displayed, only overriding what the test cares about. */
function reconcile(target: Partial<AbilityScores>, rest: Partial<AbilityScoreReconciliationInput> = {}) {
  return reconcileAbilityScores({
    displayed: scores(),
    target: scores(target),
    background: NO_ALLOCATION,
    asiSlots: [],
    ...rest,
  });
}

describe("backgroundAllocationCandidates", () => {
  it("returns nothing for a background without ability options", () => {
    expect(backgroundAllocationCandidates(NO_ALLOCATION)).toEqual([]);
  });

  it("lists every +2/+1 pairing for a '2-1' background", () => {
    const candidates = backgroundAllocationCandidates(PHYSICAL_2_1);
    expect(candidates).toHaveLength(6);
    expect(candidates).toContainEqual({ strength: 2, dexterity: 1 });
    expect(candidates).toContainEqual({ constitution: 2, strength: 1 });
    expect(candidates.every((candidate) => Object.values(candidate).sort().join() === "1,2")).toBe(true);
  });

  it("lists the single +1/+1/+1 combination for a '1-1-1' background of three abilities", () => {
    expect(backgroundAllocationCandidates(PHYSICAL_1_1_1)).toEqual([{ strength: 1, dexterity: 1, constitution: 1 }]);
  });

  it("lists every three-ability combination when more than three are allowed", () => {
    const wide = background({ from: ["strength", "dexterity", "constitution", "wisdom"], allocation: "1-1-1" });
    expect(backgroundAllocationCandidates(wide)).toHaveLength(4);
  });

  it("ignores duplicate abilities in the list", () => {
    const dupes = background({ from: ["strength", "strength", "dexterity"], allocation: "2-1" });
    expect(backgroundAllocationCandidates(dupes)).toEqual([
      { strength: 2, dexterity: 1 },
      { dexterity: 2, strength: 1 },
    ]);
  });
});

describe("reconcileAbilityScores", () => {
  it("reports nothing when the scores already match", () => {
    expect(reconcile({}, { asiSlots: [slot(4)] })).toEqual({
      missing: {},
      backgroundAbilityBonuses: undefined,
      abilityScoreImprovements: {},
      filledSlots: [],
      unfilledSlots: [slot(4)],
      leftover: {},
      excess: {},
    });
  });

  it("fills an ASI with +2 to one ability (the README's STR 16 -> 18 example)", () => {
    const result = reconcile({ strength: 18 }, { displayed: scores({ strength: 16 }), asiSlots: [slot(4)] });
    expect(result.missing).toEqual({ strength: 2 });
    expect(result.abilityScoreImprovements).toEqual({ "0:4": { strength: 2 } });
    expect(result.filledSlots).toEqual([slot(4)]);
    expect(result.leftover).toEqual({});
  });

  it("fills an ASI with +1/+1 when no single ability is missing 2", () => {
    const result = reconcile({ strength: 11, wisdom: 11 }, { asiSlots: [slot(4)] });
    expect(result.abilityScoreImprovements).toEqual({ "0:4": { strength: 1, wisdom: 1 } });
  });

  it("fills slots in order, the ability missing the most first, ties broken STR to CHA", () => {
    const result = reconcile({ strength: 12, dexterity: 12, constitution: 11 }, { asiSlots: [slot(4), slot(8), slot(12)] });
    expect(result.abilityScoreImprovements).toEqual({ "0:4": { strength: 2 }, "0:8": { dexterity: 2 } });
    expect(result.filledSlots).toEqual([slot(4), slot(8)]);
    expect(result.unfilledSlots).toEqual([slot(12)]);
    expect(result.leftover).toEqual({ constitution: 1 });
  });

  it("leaves a slot unfilled when there aren't two points to put in it", () => {
    const result = reconcile({ wisdom: 11 }, { asiSlots: [slot(4)] });
    expect(result.abilityScoreImprovements).toEqual({});
    expect(result.unfilledSlots).toEqual([slot(4)]);
    expect(result.leftover).toEqual({ wisdom: 1 });
  });

  it("reports points with no slot at all as leftover", () => {
    expect(reconcile({ charisma: 14 }).leftover).toEqual({ charisma: 4 });
  });

  it("reports abilities where this app shows more than D&D Beyond as excess, never as missing", () => {
    const result = reconcile({ dexterity: 14 }, { displayed: scores({ dexterity: 16 }) });
    expect(result.excess).toEqual({ dexterity: 2 });
    expect(result.missing).toEqual({});
  });

  describe("2024 background allocation", () => {
    it("records a matching +2/+1 as the background's allocation", () => {
      const result = reconcile({ strength: 12, constitution: 11 }, { background: PHYSICAL_2_1 });
      expect(result.backgroundAbilityBonuses).toEqual({ strength: 2, constitution: 1 });
      expect(result.leftover).toEqual({});
    });

    it("records a matching +1/+1/+1", () => {
      const result = reconcile({ strength: 11, dexterity: 11, constitution: 11 }, { background: PHYSICAL_1_1_1 });
      expect(result.backgroundAbilityBonuses).toEqual({ strength: 1, dexterity: 1, constitution: 1 });
    });

    it("prefers applying the background over leaving it unset when both place the same points", () => {
      // Background +2 STR/+1 CON places 3 points; without it an ASI would place only STR +2.
      const result = reconcile({ strength: 12, constitution: 11 }, { background: PHYSICAL_2_1, asiSlots: [slot(4)] });
      expect(result.backgroundAbilityBonuses).toEqual({ strength: 2, constitution: 1 });
      expect(result.unfilledSlots).toEqual([slot(4)]);
    });

    it("splits points between the background and ASIs to place as many as possible", () => {
      const result = reconcile({ strength: 14, dexterity: 11 }, { background: PHYSICAL_2_1, asiSlots: [slot(4)] });
      expect(result.backgroundAbilityBonuses).toEqual({ strength: 2, dexterity: 1 });
      expect(result.abilityScoreImprovements).toEqual({ "0:4": { strength: 2 } });
      expect(result.leftover).toEqual({});
    });

    it("never records a background allocation outside its listed abilities", () => {
      const result = reconcile({ wisdom: 12, intelligence: 11 }, { background: PHYSICAL_2_1 });
      expect(result.backgroundAbilityBonuses).toBeUndefined();
      expect(result.leftover).toEqual({ wisdom: 2, intelligence: 1 });
    });

    it("leaves the background unset when the missing points can't cover a full allocation", () => {
      const result = reconcile({ strength: 12 }, { background: PHYSICAL_2_1, asiSlots: [slot(4)] });
      expect(result.backgroundAbilityBonuses).toBeUndefined();
      expect(result.abilityScoreImprovements).toEqual({ "0:4": { strength: 2 } });
    });

    it("uses D&D Beyond's own background split when it's legal and fits", () => {
      // STR+2, DEX+1, CON+2 with one ASI: several splits place all 5 points.
      const input = { background: PHYSICAL_2_1, asiSlots: [slot(4)] };
      const target = { strength: 12, dexterity: 11, constitution: 12 };
      expect(reconcile(target, input).backgroundAbilityBonuses).toEqual({ strength: 2, dexterity: 1 });
      const preferred = reconcile(target, { ...input, preferredBackground: { constitution: 2, dexterity: 1 } });
      expect(preferred.backgroundAbilityBonuses).toEqual({ constitution: 2, dexterity: 1 });
      expect(preferred.abilityScoreImprovements).toEqual({ "0:4": { strength: 2 } });
      expect(preferred.leftover).toEqual({});
    });

    it("ignores a preferred split that isn't a legal allocation", () => {
      const result = reconcile({ strength: 12, constitution: 11 }, { background: PHYSICAL_2_1, preferredBackground: { strength: 3 } });
      expect(result.backgroundAbilityBonuses).toEqual({ strength: 2, constitution: 1 });
    });
  });

  it("never allocates more than was missing (bookkeeping always equals the applied points)", () => {
    const target = { strength: 15, dexterity: 13, constitution: 12, wisdom: 11 };
    const result = reconcile(target, { background: PHYSICAL_2_1, asiSlots: [slot(4), slot(6), slot(8)] });
    const applied: Partial<AbilityScores> = {};
    const add = (bonuses: Partial<AbilityScores> | undefined) => {
      for (const [key, value] of Object.entries(bonuses ?? {})) {
        applied[key as keyof AbilityScores] = (applied[key as keyof AbilityScores] ?? 0) + (value ?? 0);
      }
    };
    add(result.backgroundAbilityBonuses);
    Object.values(result.abilityScoreImprovements).forEach(add);
    add(result.leftover);
    expect(applied).toEqual(result.missing);
  });
});

describe("formatAbilityBonuses", () => {
  it("formats bonuses in STR-to-CHA order", () => {
    expect(formatAbilityBonuses({ constitution: 1, strength: 2 })).toBe("+2 STR, +1 CON");
  });

  it("uses a custom sign and skips zeros", () => {
    expect(formatAbilityBonuses({ dexterity: 2, wisdom: 0 }, "-")).toBe("-2 DEX");
  });

  it("returns an empty string when there's nothing to show", () => {
    expect(formatAbilityBonuses({})).toBe("");
  });
});
