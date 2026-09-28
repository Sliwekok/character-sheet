import { describe, it, expect } from "vitest";
import { calculateArmorClass, getArmorClassBreakdown } from "./calculateArmorClass";
import { armor, classLevel, makeCharacter } from "../../tests/fixtures/characters";
import type { AbilityScores, Character } from "@/interfaces/Characters";
import type { Armor } from "@/interfaces/Armor";
import type { MagicItem } from "@/interfaces/MagicItem";
import type { Edition } from "@/interfaces/Edition";
import { Fighter as Fighter2014 } from "@/data/2014/classes/Fighter";
import { Wizard as Wizard2014 } from "@/data/2014/classes/Wizard";

const worn = (name: string, extra: Partial<Armor> = {}) => armor(name, { equipped: true, ...extra });

function character(dexterity: number, armors: Armor[] = [], overrides: Partial<Character> = {}): Character {
    const base = makeCharacter(overrides);
    const abilityScores: AbilityScores = { ...base.abilityScores, dexterity };
    return { ...base, abilityScores, armors };
}

const ringOfProtection: MagicItem = {
    name: "Ring of Protection",
    category: "ring",
    rarity: "rare",
    requiresAttunement: true,
    description: "+1 bonus to AC and saving throws.",
    bonuses: { armorClass: 1 },
};

/** The fixture Fighter (either edition) with the Defense Fighting Style chosen. */
const defenseFighter = (edition: Edition, armors: Armor[], dexterity = 10) =>
    character(dexterity, armors, {
        edition,
        featureChoices: { "0:Fighting Style:fightingStyle": "defense" },
    });

describe("calculateArmorClass", () => {
    describe("unarmored", () => {
        it.each([
            [10, 10],
            [16, 13],
            [8, 9],
            [20, 15],
        ])("with Dex %i is 10 + Dex modifier = %i", (dex, ac) => {
            expect(calculateArmorClass(character(dex))).toBe(ac);
        });

        it("works when the character has no armors list at all", () => {
            expect(calculateArmorClass({ ...makeCharacter(), armors: undefined })).toBe(10);
        });

        it("ignores armor that is owned but not worn", () => {
            expect(calculateArmorClass(character(14, [armor("Plate"), armor("Shield", { equipped: false })]))).toBe(12);
        });
    });

    describe("light armor", () => {
        it("adds the full Dex modifier", () => {
            expect(calculateArmorClass(character(18, [worn("Leather")]))).toBe(15);
            expect(calculateArmorClass(character(20, [worn("Studded Leather")]))).toBe(17);
        });

        it("applies a negative Dex modifier", () => {
            expect(calculateArmorClass(character(8, [worn("Leather")]))).toBe(10);
        });
    });

    describe("medium armor", () => {
        it("caps the Dex bonus at +2", () => {
            expect(calculateArmorClass(character(18, [worn("Half Plate")]))).toBe(17);
            expect(calculateArmorClass(character(14, [worn("Chain Shirt")]))).toBe(15);
        });

        it("still applies a negative Dex modifier in full", () => {
            expect(calculateArmorClass(character(6, [worn("Breastplate")]))).toBe(12);
        });
    });

    describe("heavy armor", () => {
        it("ignores Dex entirely, high or low", () => {
            expect(calculateArmorClass(character(18, [worn("Plate")]))).toBe(18);
            expect(calculateArmorClass(character(6, [worn("Chain Mail")]))).toBe(16);
        });
    });

    describe("magic armor", () => {
        it("adds the armor's magic bonus", () => {
            expect(calculateArmorClass(character(10, [worn("Plate", { bonus: 1 })]))).toBe(19);
            expect(calculateArmorClass(character(16, [worn("Studded Leather", { bonus: 2 })]))).toBe(17);
        });
    });

    describe("shields", () => {
        it("adds +2 on top of body armor", () => {
            expect(calculateArmorClass(character(10, [worn("Chain Mail"), worn("Shield")]))).toBe(18);
        });

        it("adds +2 on top of unarmored AC", () => {
            expect(calculateArmorClass(character(14, [worn("Shield")]))).toBe(14);
        });

        it("adds a magic shield's bonus", () => {
            expect(calculateArmorClass(character(10, [worn("Shield", { bonus: 1 })]))).toBe(13);
        });
    });

    describe("Defense Fighting Style", () => {
        it.each(["2014", "2024"] as const)("adds +1 while wearing armor (%s)", (edition) => {
            expect(calculateArmorClass(defenseFighter(edition, [worn("Chain Mail")]))).toBe(17);
        });

        it.each(["2014", "2024"] as const)("adds nothing while unarmored (%s)", (edition) => {
            expect(calculateArmorClass(defenseFighter(edition, []))).toBe(10);
        });

        it("adds nothing with only a shield", () => {
            expect(calculateArmorClass(defenseFighter("2024", [worn("Shield")]))).toBe(12);
        });

        it("adds nothing for a Fighting Style without an AC effect", () => {
            const archer = character(10, [worn("Chain Mail")], {
                featureChoices: { "0:Fighting Style:fightingStyle": "archery" },
            });
            expect(calculateArmorClass(archer)).toBe(16);
        });

        it("applies from a multiclass Fighter's own class index", () => {
            const wizardFighter = character(10, [worn("Chain Mail")], {
                edition: "2014",
                classes: [classLevel(Wizard2014, 1), classLevel(Fighter2014, 1)],
                featureChoices: { "1:Fighting Style:fightingStyle": "defense" },
            });
            expect(calculateArmorClass(wizardFighter)).toBe(17);
        });
    });

    describe("magic items", () => {
        it("adds an AC bonus from a non-armor magic item, even unarmored", () => {
            expect(calculateArmorClass(character(14, [], { magicItems: [ringOfProtection] }))).toBe(13);
        });

        it("stacks every item's AC bonus and ignores items without one", () => {
            const cloak: MagicItem = { ...ringOfProtection, name: "Cloak of Protection", category: "wondrous item" };
            const bagOfHolding: MagicItem = { ...ringOfProtection, name: "Bag of Holding", bonuses: undefined };
            const hero = character(10, [worn("Plate", { bonus: 1 }), worn("Shield")], {
                magicItems: [ringOfProtection, cloak, bagOfHolding],
            });
            expect(calculateArmorClass(hero)).toBe(23);
        });
    });

    it.todo(
        "BUG: Unarmored Defense (Barbarian 10 + Dex + Con, Monk 10 + Dex + Wis) is never applied - an unarmored Barbarian with Dex 14/Con 16 gets AC 12 instead of 15"
    );
});

describe("getArmorClassBreakdown", () => {
    it("explains unarmored AC", () => {
        expect(getArmorClassBreakdown(character(14))).toEqual({
            lines: [
                { label: "Unarmored base", value: "10" },
                { label: "Dexterity modifier", value: "+2" },
                { label: "Total AC", value: "12" },
            ],
            total: 12,
        });
    });

    it("shows a negative Dex modifier with its sign", () => {
        expect(getArmorClassBreakdown(character(8)).lines[1]).toEqual({ label: "Dexterity modifier", value: "-1" });
    });

    it("explains capped medium armor with magic bonus, shield, Fighting Style and magic item", () => {
        const hero = character(18, [worn("Half Plate", { name: "Half Plate +1", bonus: 1 }), worn("Shield", { bonus: 2 })], {
            featureChoices: { "0:Fighting Style:fightingStyle": "defense" },
            magicItems: [ringOfProtection],
        });
        expect(getArmorClassBreakdown(hero)).toEqual({
            lines: [
                { label: "Half Plate +1 base AC", value: "15" },
                { label: "Dexterity modifier (capped at +2)", value: "+2" },
                { label: "Armor magic bonus", value: "+1" },
                { label: "Shield", value: "+2" },
                { label: "Shield magic bonus", value: "+2" },
                { label: "Defense (Fighting Style)", value: "+1" },
                { label: "Ring of Protection (magic item)", value: "+1" },
                { label: "Total AC", value: "24" },
            ],
            total: 24,
        });
    });

    it("shows no Dex line for heavy armor", () => {
        expect(getArmorClassBreakdown(character(16, [worn("Plate")])).lines).toEqual([
            { label: "Plate base AC", value: "18" },
            { label: "Total AC", value: "18" },
        ]);
    });

    it("shows an uncapped Dex line for light armor", () => {
        expect(getArmorClassBreakdown(character(16, [worn("Leather")])).lines[1]).toEqual({
            label: "Dexterity modifier",
            value: "+3",
        });
    });

    it("always totals to calculateArmorClass", () => {
        const hero = character(15, [worn("Scale Mail"), worn("Shield")]);
        expect(getArmorClassBreakdown(hero).total).toBe(calculateArmorClass(hero));
    });
});
