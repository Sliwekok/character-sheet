import {Race} from "@/interfaces/Race";
import {CharacterClass} from "@/interfaces/CharacterClass";
import {Armor} from './Armor';
import {Currency} from "@/interfaces/Currency";
import {AbilityModifiers} from "@/utils/abilityModifiers";

export type AbilityScores = {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
};

export interface Character {
    name: string;
    level: number;
    race: Race;
    background: string;
    alignment: string;
    class: CharacterClass;
    abilityScores: AbilityScores;
    equippedArmor?: Armor;
    shield?: Armor;
    currency: Currency;
    initiative: number;
    currentHP: number;
    maxHP: number;
    getModifiers: () => AbilityModifiers;
}
