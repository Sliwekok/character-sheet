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
import { MagicItem } from "@/interfaces/MagicItem";
import { CharacterDetails } from "@/interfaces/CharacterDetails";

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
    /**
     * Magic items carried/owned that aren't the equipped armor, shield, or
     * one of `weapons` above (those three can each be magic ITEMS in their
     * own right via the magic-item fields on Armor/Weapon - see e.g.
     * `equippedArmor.rarity`). This covers everything else: wondrous
     * items, rings, rods, staves, wands, potions, scrolls. Optional since
     * most characters start with none.
     */
    magicItems?: MagicItem[];
    /**
     * The player's chosen allocation of `background.abilityScoreOptions`
     * (2024 only - see Background.ts). `abilityScores` above already has
     * this baked in - it's always the FINAL, effective score - this field
     * exists only so editing a character can recover what was originally
     * rolled/bought/typed at the Ability Scores step versus what came from
     * the background, via utils/abilityScoreBonuses.ts's
     * subtractAbilityScores(). Undefined for 2014 characters, which don't
     * have this mechanic at all (see Race.abilityModifiers instead, which
     * needs no such bookkeeping since it isn't a player choice).
     */
    backgroundAbilityBonuses?: Partial<AbilityScores>;
    /**
     * Flavor/print-only fields (backstory, appearance, personality traits,
     * death saves, etc.) - see CharacterDetails.ts. Undefined for any
     * character created before this existed, or from the random generator;
     * the print sheet (app/character/[id]/print) treats that the same as
     * "every field blank", same as a fresh paper sheet.
     */
    details?: CharacterDetails;
}

/** Total character level - the sum of every class's level. */
export function getCharacterLevel(character: Character): number {
    return character.classes.reduce((total, entry) => total + entry.level, 0);
}
