import { describe, it, expect } from "vitest";
import { getMagicItemCount, isMagicEquipment } from "./magicItemCount";
import { armor, makeCharacter, weapon } from "../../tests/fixtures/characters";
import type { MagicItem } from "@/interfaces/MagicItem";

const bagOfHolding: MagicItem = {
    name: "Bag of Holding",
    category: "wondrous item",
    rarity: "uncommon",
    requiresAttunement: false,
    description: "A bag that holds more than it should.",
};

describe("isMagicEquipment", () => {
    it("is false for mundane weapons and armor", () => {
        expect(isMagicEquipment(weapon("Longsword"))).toBe(false);
        expect(isMagicEquipment(armor("Plate"))).toBe(false);
    });

    it("is true for a positive bonus", () => {
        expect(isMagicEquipment(weapon("Longsword", { bonus: 1 }))).toBe(true);
        expect(isMagicEquipment(armor("Shield", { bonus: 2 }))).toBe(true);
    });

    it("is false for a zero or negative bonus alone", () => {
        expect(isMagicEquipment(weapon("Dagger", { bonus: 0 }))).toBe(false);
        expect(isMagicEquipment(weapon("Dagger", { bonus: -1 }))).toBe(false);
    });

    it("is true for a rarity or a magic description with no bonus", () => {
        expect(isMagicEquipment(armor("Splint", { rarity: "uncommon" }))).toBe(true);
        expect(isMagicEquipment(weapon("Dagger", { magicDescription: "Glows near orcs." }))).toBe(true);
    });

    it("is false for an empty magic description", () => {
        expect(isMagicEquipment(weapon("Dagger", { magicDescription: "" }))).toBe(false);
    });
});

describe("getMagicItemCount", () => {
    it("is 0 for a character with only mundane gear", () => {
        expect(getMagicItemCount(makeCharacter({ weapons: [weapon("Longsword")], armors: [armor("Chain Mail")] }))).toBe(0);
    });

    it("is 0 when the optional lists are missing", () => {
        expect(getMagicItemCount(makeCharacter({ magicItems: undefined, armors: undefined }))).toBe(0);
    });

    it("counts magic items, magic weapons and magic armor together", () => {
        const character = makeCharacter({
            magicItems: [bagOfHolding, { ...bagOfHolding, name: "Ring of Protection", category: "ring" }],
            weapons: [weapon("Longsword", { bonus: 1 }), weapon("Dagger")],
            armors: [armor("Plate", { rarity: "rare" }), armor("Shield")],
        });
        expect(getMagicItemCount(character)).toBe(4);
    });

    it("counts unequipped magic armor too", () => {
        expect(getMagicItemCount(makeCharacter({ armors: [armor("Leather", { bonus: 1, equipped: false })] }))).toBe(1);
    });
});
