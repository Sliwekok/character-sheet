import { Character } from '../interfaces/Characters';

export function calculateArmorClass(character: Character): number {
    const armor = character.equippedArmor;
    const shield = character.shield;

    let ac: number = 10; // base AC if unarmored

    if (armor) {
        ac = armor.baseAC;

        if (armor.dexterityModifier?.enabled) {
            const dexMod = character.getModifiers.dexterity;
            const dexCap = armor.dexterityModifier.max;
            ac += dexCap !== undefined ? Math.min(dexMod, dexCap) : dexMod;
        }

        if (armor.bonus) ac += armor.bonus;
    } else {
        // unarmored: 10 + full Dex
        ac = 10 + character.abilityScores.dexterity;
    }

    if (shield) {
        ac += shield.baseAC;
        if (shield.bonus) ac += shield.bonus;
    }

    return ac;
}
