import {CharacterClass} from '../CharacterClass';
import {fullCasterProgression} from "@/interfaces/Race/SpellSlotsProgression";

export const Wizard: CharacterClass = {
    name: 'Wizard',
    hitDie: 6,
    proficiencies: ['Daggers', 'Quarterstaffs'],
    primaryAbility: 'intelligence',
    spellcasting: {
        spellcastingAbility: 'intelligence',
        progression: fullCasterProgression
    },
    casterProgression: 'full'
};
