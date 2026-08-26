import { Race } from "@/interfaces/Race";
import { CharacterClass } from "@/interfaces/CharacterClass";
import { Subclass } from "@/interfaces/Subclass";
import { Background } from "@/interfaces/Background";
import { Feat } from "@/interfaces/Feat";
import { Armor } from "./Armor";
import { Weapon } from "@/interfaces/Weapon";
import { Currency } from "@/interfaces/Currency";
import { Spell } from "@/interfaces/Spell";
import { SkillName } from "@/interfaces/Skill";
import { Edition } from "@/interfaces/Edition";

export type AbilityScores = {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
};

/** One class-and-level entry in a (possibly multiclassed) character. */
export interface CharacterClassLevel {
    class: CharacterClass;
    subclass?: Subclass;
    level: number;
}

export interface Character {
    edition: Edition;
    name: string;
    /**
     * One entry per class the character has levels in. A single-class
     * character is just a one-item array - always compute total level via
     * `getCharacterLevel`, never assume `classes[0]` is the whole story.
     */
    classes: CharacterClassLevel[];
    race: Race;
    background: Background;
    feats: Feat[];
    alignment: string;
    abilityScores: AbilityScores;
    skillProficiencies: SkillName[];
    savingThrowProficiencies: (keyof AbilityScores)[];
    equippedArmor?: Armor;
    shield?: Armor;
    weapons: Weapon[];
    currency: Currency;
    initiative: number;
    currentHP: number;
    maxHP: number;
    /** Spells the character knows or has prepared, across all of their casting classes. */
    spellsKnown: Spell[];
    languages: string[];
}

/** Total character level - the sum of every class's level. */
export function getCharacterLevel(character: Character): number {
    return character.classes.reduce((total, entry) => total + entry.level, 0);
}
