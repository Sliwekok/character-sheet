import { describe, it, expect } from "vitest";
import { classCanUseArmor, classCanUseWeapon } from "./proficiencyMatch";
import { armor, weapon } from "../../tests/fixtures/characters";
import { Fighter as Fighter2024 } from "@/data/2024/classes/Fighter";
import { Wizard as Wizard2024 } from "@/data/2024/classes/Wizard";
import { Druid as Druid2024 } from "@/data/2024/classes/Druid";
import { Monk as Monk2024 } from "@/data/2024/classes/Monk";
import { Druid as Druid2014 } from "@/data/2014/classes/Druid";
import { Cleric as Cleric2014 } from "@/data/2014/classes/Cleric";

describe("classCanUseArmor", () => {
    it("lets a Fighter use every armor category and shields", () => {
        for (const name of ["Leather", "Half Plate", "Plate", "Shield"]) {
            expect(classCanUseArmor(Fighter2024, armor(name))).toBe(true);
        }
    });

    it("limits a 2024 Druid to light armor and shields", () => {
        expect(classCanUseArmor(Druid2024, armor("Studded Leather"))).toBe(true);
        expect(classCanUseArmor(Druid2024, armor("Shield"))).toBe(true);
        expect(classCanUseArmor(Druid2024, armor("Hide"))).toBe(false);
        expect(classCanUseArmor(Druid2024, armor("Chain Mail"))).toBe(false);
    });

    it("accepts the singular 'Shield' wording (2014 Druid)", () => {
        expect(classCanUseArmor(Druid2014, armor("Shield"))).toBe(true);
        expect(classCanUseArmor(Druid2014, armor("Scale Mail"))).toBe(true);
        expect(classCanUseArmor(Druid2014, armor("Splint"))).toBe(false);
    });

    it("lets a Wizard use no armor at all", () => {
        for (const name of ["Padded", "Breastplate", "Ring Mail", "Shield"]) {
            expect(classCanUseArmor(Wizard2024, armor(name))).toBe(false);
        }
    });
});

describe("classCanUseWeapon", () => {
    it("lets a Fighter use simple and martial weapons", () => {
        expect(classCanUseWeapon(Fighter2024, weapon("Dagger"))).toBe(true);
        expect(classCanUseWeapon(Fighter2024, weapon("Longsword"))).toBe(true);
    });

    it("limits a 2024 Wizard to simple weapons", () => {
        expect(classCanUseWeapon(Wizard2024, weapon("Dagger"))).toBe(true);
        expect(classCanUseWeapon(Wizard2024, weapon("Longsword"))).toBe(false);
    });

    it("lets a 2014 Cleric use simple weapons only", () => {
        expect(classCanUseWeapon(Cleric2014, weapon("Mace"))).toBe(true);
        expect(classCanUseWeapon(Cleric2014, weapon("Longsword"))).toBe(false);
    });

    it("treats a qualified 'Martial weapons ...' entry as every martial weapon (documented limitation)", () => {
        // 2024 Monk: "Martial weapons that have the Light property" - RAW excludes a Greatsword.
        expect(classCanUseWeapon(Monk2024, weapon("Greatsword"))).toBe(true);
    });

    it.todo(
        "BUG: classes whose weapon proficiencies are listed by name (2014 Wizard/Sorcerer 'Daggers', 'Quarterstaffs'...; 2014 Druid; 2014 Rogue/Bard 'Rapiers', 'Longswords'; 2014 Monk 'Shortswords') match nothing by name - e.g. classCanUseWeapon(Wizard 2014, Dagger) is false"
    );
});
