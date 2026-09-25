import { Armor } from "@/interfaces/Armor";
import { Character } from "@/interfaces/Characters";
import { Weapon } from "@/interfaces/Weapon";

/**
 * Whether an owned weapon/armor is a magic item in its own right. Magic
 * armor and weapons are stored as plain `Armor`/`Weapon` objects (not in
 * `Character.magicItems`) with the optional magic-item fields set - see
 * the header comments on those fields. A mundane copy leaves all of them
 * unset.
 */
export function isMagicEquipment(item: Weapon | Armor): boolean {
  return Boolean(item.rarity) || Boolean(item.magicDescription) || (item.bonus ?? 0) > 0;
}

/**
 * Every magic item the character owns: `magicItems` (wondrous items,
 * rings, potions, ...) plus any magic weapons in `weapons` and magic
 * armor/shields in `armors`.
 */
export function getMagicItemCount(character: Character): number {
  const otherMagicItems = character.magicItems?.length ?? 0;
  const magicWeapons = (character.weapons ?? []).filter(isMagicEquipment).length;
  const magicArmors = (character.armors ?? []).filter(isMagicEquipment).length;
  return otherMagicItems + magicWeapons + magicArmors;
}
