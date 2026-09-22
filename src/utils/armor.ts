import { Armor } from "@/interfaces/Armor";
import { Character } from "@/interfaces/Characters";

/** A "shield" is its own equip slot, separate from body armor - a character can have one of each equipped at once. */
export function isShield(armor: Armor): boolean {
  return armor.category === "shield";
}

/** The character's currently-worn body armor (light/medium/heavy), if any - the only entry in `character.armors` with `equipped: true` that isn't a shield. */
export function getEquippedArmor(character: Pick<Character, "armors">): Armor | undefined {
  return character.armors?.find((armor) => armor.equipped && !isShield(armor));
}

/** The character's currently-worn shield, if any - the only shield-category entry in `character.armors` with `equipped: true`. */
export function getEquippedShield(character: Pick<Character, "armors">): Armor | undefined {
  return character.armors?.find((armor) => armor.equipped && isShield(armor));
}

/**
 * Builds the `Character.armors` list from a single equipped armor and/or
 * shield - used wherever a character is assembled from something that only
 * ever tracks one of each (the creation wizard, the random generator, the
 * D&D Beyond importer), so those sources don't need to know about the list
 * shape themselves. Both slots come in already-equipped.
 */
export function buildOwnedArmors(equippedArmor?: Armor, shield?: Armor): Armor[] | undefined {
  const armors: Armor[] = [];
  if (equippedArmor) armors.push({ ...equippedArmor, equipped: true });
  if (shield) armors.push({ ...shield, equipped: true });
  return armors.length > 0 ? armors : undefined;
}

/**
 * Adds one armor/shield to the character's owned list (e.g. from the Shop's
 * Armor browser) - auto-equips it only if nothing is currently occupying
 * its slot (body armor vs. shield are independent slots), otherwise it's
 * just added to the collection unequipped, ready to be worn later via
 * `toggleArmorEquipped`.
 */
export function addArmor(character: Character, armor: Armor): Armor[] {
  const current = character.armors ?? [];
  const slotOccupied = armor.category === "shield" ? getEquippedShield(character) : getEquippedArmor(character);
  return [...current, { ...armor, equipped: !slotOccupied }];
}

/**
 * Toggles whether the armor/shield at `index` is worn. Equipping one entry
 * unequips whatever else was occupying the same slot first - body armor and
 * shields are independent slots, so equipping a shield never touches
 * whatever body armor is currently worn, and vice versa (matches RAW: you
 * can wear one suit of armor and carry one shield at a time).
 */
export function toggleArmorEquipped(character: Character, index: number): Armor[] {
  const current = character.armors ?? [];
  const target = current[index];
  if (!target) return current;

  const nowEquipping = !target.equipped;

  return current.map((armor, i) => {
    if (i === index) return { ...armor, equipped: nowEquipping };
    if (nowEquipping && isShield(armor) === isShield(target) && armor.equipped) {
      return { ...armor, equipped: false };
    }
    return armor;
  });
}

/** Removes one entry from the character's owned armor/shield list entirely (the Inventory tab's "Remove" control) - unlike unequipping, there's no getting it back without re-adding it from the Shop. */
export function removeArmor(character: Character, index: number): Armor[] {
  return (character.armors ?? []).filter((_, i) => i !== index);
}

/** True when `a` and `b` refer to "the same" owned armor/shield entry - matched by name+category, the same loose, no-id convention the rest of the app uses for owned-item matching (e.g. gear stacking in `handleAddGearItem`). */
function sameArmor(a: Armor, b?: Armor): boolean {
  return !!b && a.name === b.name && a.category === b.category;
}

/**
 * Reconciles the creation/edit wizard's single equipped-armor and
 * equipped-shield picks (`CharacterDraft.equippedArmor`/`shield`) back into
 * a full owned-armor list, without losing any other armor/shield the
 * character already owned but wasn't currently wearing. Used by
 * `finalizeDraft` so re-editing a character through the wizard (which only
 * ever surfaces one worn armor and one worn shield - see
 * `SkillsEquipmentStep`) can't silently drop the rest of `character.armors`
 * that the Shop added.
 *
 * `ownedArmors` should be the character's full list as carried through the
 * draft (`CharacterDraft.ownedArmors`, seeded from `character.armors` by
 * `draftFromCharacter`) - every entry's `equipped` flag is recomputed from
 * scratch here (equipped iff it matches the wizard's current
 * `equippedArmor`/`shield` pick for its slot), and the pick itself is
 * appended if it isn't already present in the list (e.g. a brand-new
 * character, or a pick made before this entry existed).
 */
export function reconcileOwnedArmors(
  ownedArmors: Armor[],
  equippedArmor?: Armor,
  shield?: Armor
): Armor[] | undefined {
  const result = ownedArmors.map((armor) => ({
    ...armor,
    equipped: isShield(armor) ? sameArmor(armor, shield) : sameArmor(armor, equippedArmor),
  }));

  if (equippedArmor && !result.some((armor) => !isShield(armor) && sameArmor(armor, equippedArmor))) {
    result.push({ ...equippedArmor, equipped: true });
  }
  if (shield && !result.some((armor) => isShield(armor) && sameArmor(armor, shield))) {
    result.push({ ...shield, equipped: true });
  }

  return result.length > 0 ? result : undefined;
}
