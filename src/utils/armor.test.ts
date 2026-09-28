import { describe, it, expect } from "vitest";
import {
    addArmor,
    buildOwnedArmors,
    getEquippedArmor,
    getEquippedShield,
    isShield,
    reconcileOwnedArmors,
    removeArmor,
    toggleArmorEquipped,
} from "./armor";
import { armor, makeCharacter } from "../../tests/fixtures/characters";
import type { Armor } from "@/interfaces/Armor";

const withArmors = (armors: Armor[] | undefined) => makeCharacter({ armors });
const equippedNames = (armors: Armor[] | undefined) => (armors ?? []).filter((a) => a.equipped).map((a) => a.name);

describe("isShield", () => {
    it("is true only for the shield category", () => {
        expect(isShield(armor("Shield"))).toBe(true);
        expect(isShield(armor("Plate"))).toBe(false);
        expect(isShield(armor("Leather"))).toBe(false);
    });
});

describe("getEquippedArmor / getEquippedShield", () => {
    const owned = [
        armor("Leather"),
        armor("Plate", { equipped: true }),
        armor("Shield", { equipped: false }),
        armor("Shield", { name: "Spiked Shield", equipped: true }),
    ];

    it("finds the worn body armor, skipping shields and unworn armor", () => {
        expect(getEquippedArmor({ armors: owned })?.name).toBe("Plate");
    });

    it("finds the worn shield", () => {
        expect(getEquippedShield({ armors: owned })?.name).toBe("Spiked Shield");
    });

    it("returns undefined when nothing is worn or there is no list", () => {
        expect(getEquippedArmor({ armors: [armor("Leather")] })).toBeUndefined();
        expect(getEquippedShield({ armors: [armor("Plate", { equipped: true })] })).toBeUndefined();
        expect(getEquippedArmor({ armors: undefined })).toBeUndefined();
        expect(getEquippedShield({})).toBeUndefined();
    });
});

describe("buildOwnedArmors", () => {
    it("returns both pieces, equipped", () => {
        const result = buildOwnedArmors(armor("Chain Mail"), armor("Shield"));
        expect(result?.map((a) => [a.name, a.equipped])).toEqual([
            ["Chain Mail", true],
            ["Shield", true],
        ]);
    });

    it("returns just one piece when only one is given", () => {
        expect(buildOwnedArmors(undefined, armor("Shield"))?.map((a) => a.name)).toEqual(["Shield"]);
        expect(buildOwnedArmors(armor("Leather"))?.map((a) => a.name)).toEqual(["Leather"]);
    });

    it("returns undefined for nothing at all", () => {
        expect(buildOwnedArmors()).toBeUndefined();
    });

    it("does not mutate the inputs", () => {
        const leather = armor("Leather");
        buildOwnedArmors(leather);
        expect(leather.equipped).toBeUndefined();
    });
});

describe("addArmor", () => {
    it("auto-equips armor when the body slot is empty", () => {
        const result = addArmor(withArmors(undefined), armor("Leather"));
        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({ name: "Leather", equipped: true });
    });

    it("adds armor unequipped when body armor is already worn", () => {
        const result = addArmor(withArmors([armor("Plate", { equipped: true })]), armor("Leather"));
        expect(result.map((a) => [a.name, a.equipped])).toEqual([
            ["Plate", true],
            ["Leather", false],
        ]);
    });

    it("treats the shield slot independently from body armor", () => {
        const result = addArmor(withArmors([armor("Plate", { equipped: true })]), armor("Shield"));
        expect(equippedNames(result)).toEqual(["Plate", "Shield"]);
    });

    it("adds a second shield unequipped when one is worn", () => {
        const result = addArmor(withArmors([armor("Shield", { equipped: true })]), armor("Shield", { bonus: 1 }));
        expect(result.map((a) => a.equipped)).toEqual([true, false]);
    });

    it("equips new armor when the owned armor isn't worn", () => {
        const result = addArmor(withArmors([armor("Plate")]), armor("Leather"));
        expect(equippedNames(result)).toEqual(["Leather"]);
    });
});

describe("toggleArmorEquipped", () => {
    const owned = () => [
        armor("Plate", { equipped: true }),
        armor("Leather"),
        armor("Shield", { equipped: true }),
        armor("Shield", { name: "Shield +1", bonus: 1 }),
    ];

    it("equipping body armor unequips the other body armor but keeps the shield", () => {
        expect(equippedNames(toggleArmorEquipped(withArmors(owned()), 1))).toEqual(["Leather", "Shield"]);
    });

    it("equipping a shield unequips the other shield but keeps body armor", () => {
        expect(equippedNames(toggleArmorEquipped(withArmors(owned()), 3))).toEqual(["Plate", "Shield +1"]);
    });

    it("unequipping leaves everything else alone", () => {
        expect(equippedNames(toggleArmorEquipped(withArmors(owned()), 0))).toEqual(["Shield"]);
    });

    it("returns the list unchanged for an out-of-range index", () => {
        const armors = owned();
        expect(toggleArmorEquipped(withArmors(armors), 9)).toBe(armors);
        expect(toggleArmorEquipped(withArmors(undefined), 0)).toEqual([]);
    });

    it("does not mutate the original list", () => {
        const armors = owned();
        toggleArmorEquipped(withArmors(armors), 1);
        expect(equippedNames(armors)).toEqual(["Plate", "Shield"]);
    });
});

describe("removeArmor", () => {
    it("removes the entry at the index", () => {
        const armors = [armor("Plate"), armor("Leather"), armor("Shield")];
        expect(removeArmor(withArmors(armors), 1).map((a) => a.name)).toEqual(["Plate", "Shield"]);
    });

    it("is a no-op for an out-of-range index or no list", () => {
        expect(removeArmor(withArmors([armor("Plate")]), 5).map((a) => a.name)).toEqual(["Plate"]);
        expect(removeArmor(withArmors(undefined), 0)).toEqual([]);
    });
});

describe("reconcileOwnedArmors", () => {
    it("builds a fresh list from the wizard's picks when nothing is owned yet", () => {
        const result = reconcileOwnedArmors([], armor("Chain Mail"), armor("Shield"));
        expect(result?.map((a) => [a.name, a.equipped])).toEqual([
            ["Chain Mail", true],
            ["Shield", true],
        ]);
    });

    it("returns undefined when nothing is owned or picked", () => {
        expect(reconcileOwnedArmors([])).toBeUndefined();
    });

    it("keeps other owned armor, unequipped, and equips the matching pick in place", () => {
        const owned = [armor("Plate", { equipped: true }), armor("Leather"), armor("Shield", { equipped: true })];
        const result = reconcileOwnedArmors(owned, armor("Leather"), armor("Shield"));
        expect(result?.map((a) => [a.name, a.equipped])).toEqual([
            ["Plate", false],
            ["Leather", true],
            ["Shield", true],
        ]);
    });

    it("unequips everything in a slot when the pick for it was cleared", () => {
        const owned = [armor("Plate", { equipped: true }), armor("Shield", { equipped: true })];
        const result = reconcileOwnedArmors(owned, undefined, undefined);
        expect(result?.map((a) => [a.name, a.equipped])).toEqual([
            ["Plate", false],
            ["Shield", false],
        ]);
    });

    it("appends a pick that isn't in the owned list yet", () => {
        const result = reconcileOwnedArmors([armor("Leather")], armor("Half Plate"));
        expect(result?.map((a) => [a.name, a.equipped])).toEqual([
            ["Leather", false],
            ["Half Plate", true],
        ]);
    });

    it("keeps the owned copy's own data (e.g. a magic bonus) when it matches the pick", () => {
        const owned = [armor("Plate", { bonus: 2 })];
        const result = reconcileOwnedArmors(owned, armor("Plate"));
        expect(result).toHaveLength(1);
        expect(result?.[0]).toMatchObject({ name: "Plate", bonus: 2, equipped: true });
    });

    it("never equips body armor into the shield slot or vice versa", () => {
        const oddShield = armor("Shield", { name: "Plate" }); // a shield that happens to share a name
        const result = reconcileOwnedArmors([oddShield], armor("Plate"));
        expect(result?.map((a) => [a.name, a.category, a.equipped])).toEqual([
            ["Plate", "shield", false],
            ["Plate", "heavy", true],
        ]);
    });
});
