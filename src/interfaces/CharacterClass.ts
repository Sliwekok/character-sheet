import { AbilityScores } from "@/interfaces/Characters";
import { SpellcastingProgression } from './SpellSlots';
import { SpellSlots } from './SpellSlots';


export interface CharacterClass {
    name: string;
    hitDie: number;
    proficiencies: string[];
    primaryAbility: keyof AbilityScores;
    spellcasting?: {
        progression: SpellcastingProgression;
        spellcastingAbility: keyof AbilityScores;
        spellSaveDC?: (abilityScores: AbilityScores) => number;
        spellAttackBonus?: (abilityScores: AbilityScores) => number;
    };
    casterProgression: 'full' | 'half' | 'third' | 'none';
}

function getSpellSlots(
    charClass: CharacterClass,
    level: number
): SpellSlots | null {
    if (!charClass.spellcasting) return null;
    return charClass.spellcasting.progression[level] || null;
}
