import {AbilityScores} from "@/interfaces/Characters";

export type AbilityModifiers = {
    [K in keyof AbilityScores]: number;
};

export function calculateAbilityModifiers(scores: AbilityScores): AbilityModifiers {
    const modifiers: Partial<AbilityModifiers> = {};

    for (const key in scores) {
        const score = scores[key as keyof AbilityScores];
        modifiers[key as keyof AbilityScores] = Math.floor((score - 10) / 2);
    }

    return modifiers as AbilityModifiers;
}
