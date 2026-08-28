import { CharacterClass } from "@/interfaces/CharacterClass";
import { Armor } from "@/interfaces/Armor";
import { Weapon } from "@/interfaces/Weapon";

/**
 * `CharacterClass.proficiencies.armor`/`.weapons` are freeform PHB-style
 * strings ("Light armor", "Martial weapons", "Shields", ...), while
 * `Armor.category`/`Weapon.category` are the narrower typed unions
 * ("light" | "medium" | "heavy" | "shield", "simple" | "martial") used by
 * the shared equipment data (data/armor/Armor.ts, data/weapons/Weapons.ts).
 * These two functions bridge that gap with a simple case-insensitive
 * substring match - good enough to filter the equipment step and the
 * random generator down to plausible choices, but not a substitute for a
 * real proficiency-string parser if the data ever needs one (e.g. a class
 * proficient in "Martial weapons (swords only)" would still match every
 * martial weapon here).
 */
export function classCanUseArmor(characterClass: CharacterClass, armor: Armor): boolean {
    const term = armor.category === "shield" ? "shield" : armor.category;
    return characterClass.proficiencies.armor.some((entry) => entry.toLowerCase().includes(term));
}

export function classCanUseWeapon(characterClass: CharacterClass, weapon: Weapon): boolean {
    return characterClass.proficiencies.weapons.some((entry) =>
        entry.toLowerCase().includes(weapon.category)
    );
}
