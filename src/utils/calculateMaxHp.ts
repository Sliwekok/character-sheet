import {Character} from "@/interfaces/Characters";

export function calculateMaxHP(character: Character): number {
    const { level, class: charClass, abilityScores } = character;
    const conMod = abilityScores.constitution;

    const firstLevelHP = charClass.hitDie + conMod;
    const restLevelsHP = (level - 1) * (Math.floor(charClass.hitDie / 2) + 1 + conMod);

    return firstLevelHP + restLevelsHP;
}
