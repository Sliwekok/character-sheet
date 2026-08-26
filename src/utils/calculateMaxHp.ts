import { Character } from "@/interfaces/Characters";
import { calculateAbilityModifiers } from "./abilityModifiers";

/**
 * Max HP across one or more classes. RAW: the very first level the
 * character ever took (character.classes[0]) uses its class's full hit
 * die + Con modifier; every level after that - in ANY class, multiclassed
 * or not - uses that class's own hit die average (floor(hitDie/2)+1) +
 * Con modifier.
 *
 * This replaces the previous single-class-only formula, which also had a
 * bug: it added the raw Constitution SCORE instead of the modifier,
 * overstating HP for anyone with Constitution above 10.
 */
export function calculateMaxHP(character: Character): number {
    const conMod = calculateAbilityModifiers(character.abilityScores).constitution;

    return character.classes.reduce((total, { class: charClass, level }, classIndex) => {
        const isFirstClassTaken = classIndex === 0;
        const firstLevelHP = isFirstClassTaken ? charClass.hitDie + conMod : 0;
        const levelsAfterFirst = isFirstClassTaken ? level - 1 : level;
        const perLevelHP = Math.floor(charClass.hitDie / 2) + 1 + conMod;

        return total + firstLevelHP + levelsAfterFirst * perLevelHP;
    }, 0);
}
