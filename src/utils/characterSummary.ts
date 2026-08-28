import { StoredCharacter } from "@/interfaces/StoredCharacter";
import { CharacterSummary } from "@/components/character/CharacterCard";
import { getCharacterLevel } from "@/interfaces/Characters";
import { calculateAbilityModifiers } from "@/utils/abilityModifiers";
import { calculateArmorClass } from "@/utils/calculateArmorClass";

/**
 * Derives the compact `CharacterSummary` the character list (`/home`) and
 * `CharacterCard` render, from a full stored character. Kept separate from
 * `CharacterCard` itself so the card can stay decoupled from where its data
 * comes from (see that component's own header comment).
 */
export function toCharacterSummary(character: StoredCharacter): CharacterSummary {
    return {
        id: character.id,
        name: character.name,
        level: getCharacterLevel(character),
        alignment: character.alignment,
        className: character.classes.map((entry) => entry.class.name).join(" / "),
        armorClass: calculateArmorClass(character),
        initiative: character.initiative,
        abilityModifiers: calculateAbilityModifiers(character.abilityScores),
    };
}
