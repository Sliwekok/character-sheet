import { describe, it, expect } from "vitest";
import {
    areAsiSlotsComplete,
    getAsiSlots,
    isValidAsiAllocation,
    pruneAsiAllocations,
    randomAsiAllocations,
    sumAsiAllocations,
    type AsiSlot,
} from "./abilityScoreImprovements";
import { Fighter as Fighter2024 } from "@/data/2024/classes/Fighter";
import { Wizard as Wizard2024 } from "@/data/2024/classes/Wizard";
import { Rogue as Rogue2024 } from "@/data/2024/classes/Rogue";
import { Fighter as Fighter2014 } from "@/data/2014/classes/Fighter";
import { Wizard as Wizard2014 } from "@/data/2014/classes/Wizard";

const slotLevels = (slots: AsiSlot[]) => slots.map((slot) => slot.level);

describe("getAsiSlots", () => {
    it("has no slots below level 4", () => {
        expect(getAsiSlots([{ characterClass: Wizard2024, level: 3 }])).toEqual([]);
    });

    it("gives a slot at level 4 with a stable key", () => {
        expect(getAsiSlots([{ characterClass: Wizard2024, level: 4 }])).toEqual([
            { key: "0:4", classIndex: 0, className: "Wizard", level: 4 },
        ]);
    });

    it("follows the standard 2024 progression (4, 8, 12, 16; level 19 is an Epic Boon)", () => {
        expect(slotLevels(getAsiSlots([{ characterClass: Wizard2024, level: 20 }]))).toEqual([4, 8, 12, 16]);
    });

    it("follows the standard 2014 progression (4, 8, 12, 16, 19)", () => {
        expect(slotLevels(getAsiSlots([{ characterClass: Wizard2014, level: 20 }]))).toEqual([4, 8, 12, 16, 19]);
    });

    it("includes the Fighter's bonus ASIs", () => {
        expect(slotLevels(getAsiSlots([{ characterClass: Fighter2014, level: 20 }]))).toEqual([4, 6, 8, 12, 14, 16, 19]);
        expect(slotLevels(getAsiSlots([{ characterClass: Fighter2024, level: 20 }]))).toEqual([4, 6, 8, 12, 14, 16]);
    });

    it("includes the 2024 Rogue's bonus ASI at 10", () => {
        expect(slotLevels(getAsiSlots([{ characterClass: Rogue2024, level: 20 }]))).toEqual([4, 8, 10, 12, 16]);
    });

    it.todo(
        "BUG: the 2014 Rogue should get ASIs at 4, 8, 10, 12, 16 and 19 - src/data/2014/classes/Rogue.ts has no level-16 'Ability Score Improvement' feature (its own description lists 16th)"
    );

    it("counts each class's own level separately when multiclassed", () => {
        const slots = getAsiSlots([
            { characterClass: Fighter2024, level: 6 },
            { characterClass: Wizard2024, level: 4 },
        ]);
        expect(slots).toEqual([
            { key: "0:4", classIndex: 0, className: "Fighter", level: 4 },
            { key: "0:6", classIndex: 0, className: "Fighter", level: 6 },
            { key: "1:4", classIndex: 1, className: "Wizard", level: 4 },
        ]);
    });

    it("gives no ASI to a 3/3 multiclass even at total level 6", () => {
        expect(
            getAsiSlots([
                { characterClass: Wizard2024, level: 3 },
                { characterClass: Fighter2024, level: 3 },
            ])
        ).toEqual([]);
    });

    it("skips entries with no class chosen yet, keeping the other indexes", () => {
        expect(getAsiSlots([{ level: 8 }, { characterClass: Wizard2024, level: 4 }])).toEqual([
            { key: "1:4", classIndex: 1, className: "Wizard", level: 4 },
        ]);
    });
});

describe("isValidAsiAllocation", () => {
    it("accepts +2 to one ability", () => {
        expect(isValidAsiAllocation({ strength: 2 })).toBe(true);
    });

    it("accepts +1 to two different abilities", () => {
        expect(isValidAsiAllocation({ strength: 1, constitution: 1 })).toBe(true);
    });

    it("ignores zero entries", () => {
        expect(isValidAsiAllocation({ strength: 2, dexterity: 0 })).toBe(true);
    });

    it("rejects an unchosen allocation", () => {
        expect(isValidAsiAllocation(undefined)).toBe(false);
        expect(isValidAsiAllocation({})).toBe(false);
        expect(isValidAsiAllocation({ strength: 0 })).toBe(false);
    });

    it("rejects anything other than exactly 2 points in a legal shape", () => {
        expect(isValidAsiAllocation({ strength: 1 })).toBe(false);
        expect(isValidAsiAllocation({ strength: 3 })).toBe(false);
        expect(isValidAsiAllocation({ strength: 2, dexterity: 1 })).toBe(false);
        expect(isValidAsiAllocation({ strength: 2, dexterity: 2 })).toBe(false);
        expect(isValidAsiAllocation({ strength: 1, dexterity: 1, wisdom: 1 })).toBe(false);
        expect(isValidAsiAllocation({ strength: 3, dexterity: -1 })).toBe(false);
    });
});

describe("areAsiSlotsComplete", () => {
    const slots = getAsiSlots([{ characterClass: Fighter2024, level: 6 }]);

    it("is true when every slot has a legal allocation", () => {
        expect(areAsiSlotsComplete(slots, { "0:4": { strength: 2 }, "0:6": { dexterity: 1, constitution: 1 } })).toBe(true);
    });

    it("is false when any slot is missing or incomplete", () => {
        expect(areAsiSlotsComplete(slots, { "0:4": { strength: 2 } })).toBe(false);
        expect(areAsiSlotsComplete(slots, { "0:4": { strength: 2 }, "0:6": { dexterity: 1 } })).toBe(false);
    });

    it("is true when there are no slots", () => {
        expect(areAsiSlotsComplete([], {})).toBe(true);
    });
});

describe("sumAsiAllocations", () => {
    const slots = getAsiSlots([{ characterClass: Fighter2024, level: 8 }]);

    it("adds every slot's allocation together", () => {
        expect(
            sumAsiAllocations(slots, {
                "0:4": { strength: 2 },
                "0:6": { strength: 1, constitution: 1 },
                "0:8": { constitution: 2 },
            })
        ).toEqual({ strength: 3, constitution: 3 });
    });

    it("skips slots with no allocation and ignores allocations without a slot", () => {
        expect(sumAsiAllocations(slots, { "0:4": { dexterity: 2 }, "1:4": { wisdom: 2 } })).toEqual({ dexterity: 2 });
    });

    it("includes an incomplete allocation's points as they stand", () => {
        expect(sumAsiAllocations(slots, { "0:4": { dexterity: 1 } })).toEqual({ dexterity: 1 });
    });

    it("returns nothing for no slots", () => {
        expect(sumAsiAllocations([], { "0:4": { strength: 2 } })).toEqual({});
    });
});

describe("pruneAsiAllocations", () => {
    it("drops allocations whose slot no longer exists", () => {
        const slots = getAsiSlots([{ characterClass: Fighter2024, level: 5 }]);
        expect(
            pruneAsiAllocations(slots, {
                "0:4": { strength: 2 },
                "0:6": { strength: 2 },
                "1:4": { wisdom: 2 },
            })
        ).toEqual({ "0:4": { strength: 2 } });
    });

    it("keeps everything when all slots still exist", () => {
        const slots = getAsiSlots([{ characterClass: Fighter2024, level: 6 }]);
        const allocations = { "0:4": { strength: 2 }, "0:6": { dexterity: 2 } };
        expect(pruneAsiAllocations(slots, allocations)).toEqual(allocations);
    });

    it("keeps an allocation even if it is incomplete", () => {
        const slots = getAsiSlots([{ characterClass: Fighter2024, level: 4 }]);
        expect(pruneAsiAllocations(slots, { "0:4": { strength: 1 } })).toEqual({ "0:4": { strength: 1 } });
    });
});

describe("randomAsiAllocations", () => {
    const slots = getAsiSlots([
        { characterClass: Fighter2014, level: 20 },
        { characterClass: Wizard2014, level: 4 },
    ]);

    it("fills every slot with a legal allocation", () => {
        for (let i = 0; i < 20; i++) {
            const allocations = randomAsiAllocations(slots);
            expect(Object.keys(allocations).sort()).toEqual(slots.map((slot) => slot.key).sort());
            expect(areAsiSlotsComplete(slots, allocations)).toBe(true);
        }
    });

    it("returns nothing for no slots", () => {
        expect(randomAsiAllocations([])).toEqual({});
    });
});
