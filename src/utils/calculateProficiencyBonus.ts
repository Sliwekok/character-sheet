import { Character, getCharacterLevel } from "@/interfaces/Characters";

/** Standard 5e proficiency bonus by total character level - +2 at 1-4, +3 at 5-8, +4 at 9-12, +5 at 13-16, +6 at 17-20. Identical between editions and unaffected by multiclassing beyond total level. */
export function calculateProficiencyBonus(character: Character): number {
  return Math.floor((getCharacterLevel(character) - 1) / 4) + 2;
}
