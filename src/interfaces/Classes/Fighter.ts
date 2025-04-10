import { CharacterClass } from '../CharacterClass';
import {fullCasterProgression} from "@/interfaces/Race/SpellSlotsProgression";

export const Fighter: CharacterClass = {
    name: 'Fighter',
    hitDie: 10,
    proficiencies: ['All armor', 'Shields', 'Simple weapons', 'Martial weapons'],
    primaryAbility: 'strength',
    casterProgression: 'none',
};
