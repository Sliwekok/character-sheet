import { describe, it, expect } from "vitest";
import {
    isValidBackgroundAllocation,
    randomBackgroundAllocation,
    subtractAbilityScores,
    sumAbilityScores,
} from "./abilityScoreBonuses";
import type { AbilityScores } from "@/interfaces/Characters";
import type { Background } from "@/interfaces/Background";
import { BACKGROUNDS_2024 } from "@/data/2024/backgrounds/Backgrounds";
import { BACKGROUNDS_2014 } from "@/data/2014/backgrounds/Backgrounds";

const base: AbilityScores = { strength: 15, dexterity: 14, constitution: 13, intelligence: 12, wisdom: 10, charisma: 8 };

const background2024 = (name: string): Background => {
    const found = BACKGROUNDS_2024.find((entry) => entry.name === name);
    if (!found) throw new Error(`no 2024 background "${name}"`);
    return found;
};

/** Acolyte (2024): Intelligence, Wisdom, Charisma. */
const acolyte = background2024("Acolyte");
const soldier2014 = BACKGROUNDS_2014.find((entry) => entry.name === "Soldier")!;

/** A synthetic background using the "+1/+1/+1" allocation. */
const oneOneOne: Background = {
    ...acolyte,
    abilityScoreOptions: { from: ["intelligence", "wisdom", "charisma"], allocation: "1-1-1" },
};

describe("sumAbilityScores", () => {
    it("returns the base scores when there are no bonuses", () => {
        expect(sumAbilityScores(base)).toEqual(base);
    });

    it("adds several partial bonus sets, treating missing entries as +0", () => {
        expect(sumAbilityScores(base, { strength: 2, charisma: 1 }, { charisma: 1, wisdom: 2 })).toEqual({
            ...base,
            strength: 17,
            wisdom: 12,
            charisma: 10,
        });
    });

    it("supports negative bonuses (e.g. some 2014 subraces)", () => {
        expect(sumAbilityScores(base, { intelligence: -2 }).intelligence).toBe(10);
    });

    it("does not mutate its inputs", () => {
        const copy = { ...base };
        sumAbilityScores(copy, { strength: 2 });
        expect(copy).toEqual(base);
    });
});

describe("subtractAbilityScores", () => {
    it("is the inverse of sumAbilityScores", () => {
        const bonuses: Partial<AbilityScores>[] = [{ strength: 2, dexterity: 1 }, { dexterity: 1, wisdom: 2 }];
        expect(subtractAbilityScores(sumAbilityScores(base, ...bonuses), ...bonuses)).toEqual(base);
    });

    it("returns the final scores when there are no bonuses", () => {
        expect(subtractAbilityScores(base)).toEqual(base);
    });
});

describe("isValidBackgroundAllocation", () => {
    describe("2014 backgrounds (no ability score options)", () => {
        it("accepts an empty allocation", () => {
            expect(isValidBackgroundAllocation(soldier2014, {})).toBe(true);
            expect(isValidBackgroundAllocation(undefined, {})).toBe(true);
        });

        it("accepts all-zero entries as empty", () => {
            expect(isValidBackgroundAllocation(soldier2014, { strength: 0 })).toBe(true);
        });

        it("rejects any bonus", () => {
            expect(isValidBackgroundAllocation(soldier2014, { strength: 1 })).toBe(false);
            expect(isValidBackgroundAllocation(undefined, { wisdom: 2 })).toBe(false);
        });
    });

    describe("2024 '+2/+1' backgrounds", () => {
        it("accepts +2 and +1 on two different listed abilities, in either order", () => {
            expect(isValidBackgroundAllocation(acolyte, { wisdom: 2, intelligence: 1 })).toBe(true);
            expect(isValidBackgroundAllocation(acolyte, { charisma: 1, wisdom: 2 })).toBe(true);
        });

        it("ignores zero entries", () => {
            expect(isValidBackgroundAllocation(acolyte, { wisdom: 2, intelligence: 1, strength: 0 })).toBe(true);
        });

        it("rejects an ability the background doesn't list", () => {
            expect(isValidBackgroundAllocation(acolyte, { strength: 2, wisdom: 1 })).toBe(false);
        });

        it("rejects incomplete or wrongly sized allocations", () => {
            expect(isValidBackgroundAllocation(acolyte, {})).toBe(false);
            expect(isValidBackgroundAllocation(acolyte, { wisdom: 2 })).toBe(false);
            expect(isValidBackgroundAllocation(acolyte, { wisdom: 3 })).toBe(false);
            expect(isValidBackgroundAllocation(acolyte, { wisdom: 2, intelligence: 2 })).toBe(false);
            expect(isValidBackgroundAllocation(acolyte, { wisdom: 1, intelligence: 1 })).toBe(false);
            expect(isValidBackgroundAllocation(acolyte, { wisdom: 3, intelligence: -1 })).toBe(false);
        });

        it.todo(
            "BUG: a 2024 background should also accept +1/+1/+1 across its three abilities (RAW, and docs/data-model.md) - every 2024 background is stored as allocation '2-1', so { intelligence: 1, wisdom: 1, charisma: 1 } is rejected for Acolyte"
        );
    });

    describe("'+1/+1/+1' backgrounds", () => {
        it("accepts +1 to each of three listed abilities", () => {
            expect(isValidBackgroundAllocation(oneOneOne, { intelligence: 1, wisdom: 1, charisma: 1 })).toBe(true);
        });

        it("rejects fewer than three, or a +2", () => {
            expect(isValidBackgroundAllocation(oneOneOne, { intelligence: 1, wisdom: 1 })).toBe(false);
            expect(isValidBackgroundAllocation(oneOneOne, { intelligence: 2, wisdom: 1 })).toBe(false);
            expect(isValidBackgroundAllocation(oneOneOne, { intelligence: 1, wisdom: 1, charisma: 2 })).toBe(false);
        });

        it("rejects an unlisted ability", () => {
            expect(isValidBackgroundAllocation(oneOneOne, { strength: 1, wisdom: 1, charisma: 1 })).toBe(false);
        });
    });
});

describe("randomBackgroundAllocation", () => {
    it("returns nothing for a 2014 background", () => {
        expect(randomBackgroundAllocation(soldier2014)).toEqual({});
    });

    it("always produces a valid +2/+1 allocation from the background's abilities", () => {
        for (let i = 0; i < 50; i++) {
            const allocation = randomBackgroundAllocation(acolyte);
            expect(Object.values(allocation).sort()).toEqual([1, 2]);
            expect(isValidBackgroundAllocation(acolyte, allocation)).toBe(true);
        }
    });

    it("always produces a valid +1/+1/+1 allocation for that shape", () => {
        for (let i = 0; i < 20; i++) {
            const allocation = randomBackgroundAllocation(oneOneOne);
            expect(allocation).toEqual({ intelligence: 1, wisdom: 1, charisma: 1 });
        }
    });

    it("produces a valid allocation for every real 2024 background", () => {
        for (const background of BACKGROUNDS_2024) {
            expect(isValidBackgroundAllocation(background, randomBackgroundAllocation(background))).toBe(true);
        }
    });
});
