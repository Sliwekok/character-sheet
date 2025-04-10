import {Race} from "@/interfaces/Race";
import {CharacterClass} from "@/interfaces/CharacterClass";

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
    class: CharacterClass;
    abilityScores: AbilityScores;
}
