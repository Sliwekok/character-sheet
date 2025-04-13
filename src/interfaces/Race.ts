import {AbilityScores} from "@/interfaces/Characters";

export interface Race {
    name: string;
    traits: string[];
    abilityModifiers: Partial<AbilityScores>;
    speed: number;
    languages: string[];
}
