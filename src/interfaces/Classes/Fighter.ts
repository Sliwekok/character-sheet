import { CharacterClass } from '../CharacterClass';

export const Fighter: CharacterClass = {
    name: 'Fighter',
    hitDie: 10,
    proficiencies: ['All armor', 'Shields', 'Simple weapons', 'Martial weapons'],
    primaryAbility: 'strength',
    casterProgression: 'none',
};
