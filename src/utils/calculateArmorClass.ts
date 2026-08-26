import { Character } from '@/interfaces/Characters';
import { calculateAbilityModifiers } from './abilityModifiers';

export function calculateArmorClass(character: Character): number {
    const armor = character.equippedArmor;
    const shield = character.shield;
    const dexMod = calculateAbilityModifiers(character.abilityScores).dexterity;

    let ac: number = 10; // base AC if unarmored

    if (armor) {
        ac = armor.baseAC;

        if (armor.dexterityModifier?.enabled) {
            const dexCap = armor.dexterityModifier.max;
            ac += dexCap !== undefined ? Math.min(dexMod, dexCap) : dexMod;
        }

        if (armor.bonus) ac += armor.bonus;
    } else {
        // unarmored: 10 + full Dex modifier. (Previously added the raw Dex
        // SCORE here instead of the modifier - a second bug alongside the
        // getModifiers() one below, found while fixing this file.)
        ac = 10 + dexMod;
    }

    if (shield) {
        ac += shield.baseAC;
        if (shield.bonus) ac += shield.bonus;
    }

    return ac;
}
