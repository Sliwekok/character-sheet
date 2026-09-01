import { AbilityScores, Character } from "@/interfaces/Characters";
import { Weapon } from "@/interfaces/Weapon";
import { calculateAbilityModifiers } from "@/utils/abilityModifiers";
import { calculateProficiencyBonus } from "@/utils/calculateProficiencyBonus";
import { ABILITY_LABELS } from "@/utils/statBreakdowns";
import { StatLine, formatSigned } from "@/utils/statLine";

/**
 * Which ability a weapon's attack/damage rolls use. Finesse weapons use
 * whichever of Str/Dex is currently better (RAW lets the wielder pick
 * either); ranged-type weapons (bows, crossbows) always use Dex; everything
 * else - including thrown weapons like handaxes/javelins that lack finesse
 * - uses Str, same as melee RAW.
 */
export function getWeaponAbility(weapon: Weapon, abilityScores: AbilityScores): keyof AbilityScores {
  const modifiers = calculateAbilityModifiers(abilityScores);
  if (weapon.properties.includes("finesse")) {
    return modifiers.dexterity > modifiers.strength ? "dexterity" : "strength";
  }
  return weapon.type === "ranged" ? "dexterity" : "strength";
}

/**
 * Whether any of the character's classes grant proficiency with this
 * weapon. Checks against `category` the same way
 * utils/proficiencyMatch.ts's `classCanUseWeapon` does (e.g. "Martial
 * weapons"), plus a name-based fallback for classes that list specific
 * weapons instead of a category (e.g. 2014 Wizard's "Daggers, Darts,
 * Slings, Quarterstaffs, Light crossbows") - a category-only check would
 * otherwise always call a Wizard "not proficient" with their own dagger.
 * Not a substitute for a real proficiency-string parser (same caveat
 * proficiencyMatch.ts already documents), and doesn't account for
 * proficiencies granted by a race/feat/background trait text, only class
 * proficiency lists.
 *
 * A class gained via multiclassing only contributes its narrower
 * `multiclassProficiencies` (undefined treated as none granted), mirroring
 * utils/calculateMaxHp.ts's classIndex===0 special-casing for "the class
 * the character started with" vs. "added later".
 */
export function isProficientWithWeapon(character: Character, weapon: Weapon): boolean {
  const weaponName = weapon.name.toLowerCase();
  return character.classes.some(({ class: charClass }, index) => {
    const list = index === 0 ? charClass.proficiencies.weapons : charClass.multiclassProficiencies?.weapons ?? [];
    return list.some((entry) => {
      const lower = entry.toLowerCase();
      return lower.includes(weapon.category) || lower.includes(weaponName) || lower.includes(`${weaponName}s`);
    });
  });
}

export type WeaponAttackInfo = {
  ability: keyof AbilityScores;
  abilityModifier: number;
  proficient: boolean;
  proficiencyBonus: number;
  magicBonus: number;
  attackBonus: number;
  lines: StatLine[];
};

/** Attack-roll bonus for one weapon in this character's hands, plus the line-by-line breakdown shown in its info tooltip. */
export function getWeaponAttackInfo(character: Character, weapon: Weapon): WeaponAttackInfo {
  const ability = getWeaponAbility(weapon, character.abilityScores);
  const abilityModifier = calculateAbilityModifiers(character.abilityScores)[ability];
  const proficient = isProficientWithWeapon(character, weapon);
  const proficiencyBonus = proficient ? calculateProficiencyBonus(character) : 0;
  const magicBonus = weapon.bonus ?? 0;
  const attackBonus = abilityModifier + proficiencyBonus + magicBonus;

  const lines: StatLine[] = [
    { label: `${ABILITY_LABELS[ability]} modifier`, value: formatSigned(abilityModifier) },
    { label: "Proficiency bonus", value: proficient ? formatSigned(proficiencyBonus) : "+0 (not proficient)" },
  ];
  if (magicBonus) lines.push({ label: "Magic bonus", value: formatSigned(magicBonus) });
  lines.push({ label: "Attack bonus", value: formatSigned(attackBonus) });

  return { ability, abilityModifier, proficient, proficiencyBonus, magicBonus, attackBonus, lines };
}

export type WeaponDamageInfo = {
  diceFormula: string;
  damageType: string;
  abilityModifier: number;
  magicBonus: number;
  flatBonus: number;
  lines: StatLine[];
};

/** Damage dice + flat bonus for one weapon, plus the breakdown shown in its info tooltip. Pass `useVersatile` to use `weapon.versatileDamage` (two-handed) instead of the one-handed `weapon.damage.dice`. */
export function getWeaponDamageInfo(character: Character, weapon: Weapon, useVersatile = false): WeaponDamageInfo {
  const ability = getWeaponAbility(weapon, character.abilityScores);
  const abilityModifier = calculateAbilityModifiers(character.abilityScores)[ability];
  const magicBonus = weapon.bonus ?? 0;
  const flatBonus = abilityModifier + magicBonus;
  const diceFormula = useVersatile && weapon.versatileDamage ? weapon.versatileDamage : weapon.damage.dice;

  const lines: StatLine[] = [
    { label: "Base damage", value: diceFormula },
    { label: `${ABILITY_LABELS[ability]} modifier`, value: formatSigned(abilityModifier) },
  ];
  if (magicBonus) lines.push({ label: "Magic bonus", value: formatSigned(magicBonus) });
  lines.push({ label: "Damage type", value: weapon.damage.type });

  return { diceFormula, damageType: weapon.damage.type, abilityModifier, magicBonus, flatBonus, lines };
}

export type SpellcastingInfo = {
  className: string;
  ability: keyof AbilityScores;
  abilityLabel: string;
  abilityModifier: number;
  proficiencyBonus: number;
  spellAttackBonus: number;
  spellSaveDC: number;
  lines: StatLine[];
};

/**
 * The character's spellcasting numbers, derived from the first class entry
 * with a `spellcasting` config - the same "first spellcasting class" rule
 * app/character/[id]/print/printHelpers.ts's `primarySpellcastingEntry`
 * already uses for the print sheet. A multiclass character technically
 * uses each class's own ability for spells learned through it (e.g. Int
 * for a Wizard's spells, Wis for a Cleric's), but `spellsKnown` doesn't
 * record which class a given spell came from (see interfaces/Spell.ts), so
 * one number set is shown rather than per-class ones - the same documented
 * simplification SpellsStep already lives with. Returns `null` for a
 * character with no spellcasting class at all.
 */
export function getSpellcastingInfo(character: Character): SpellcastingInfo | null {
  const entry = character.classes.find((classEntry) => classEntry.class.spellcasting);
  const spellcasting = entry?.class.spellcasting;
  if (!entry || !spellcasting) return null;

  const abilityModifier = calculateAbilityModifiers(character.abilityScores)[spellcasting.ability];
  const proficiencyBonus = calculateProficiencyBonus(character);
  const spellAttackBonus = spellcasting.spellAttackBonus
    ? spellcasting.spellAttackBonus(character.abilityScores, proficiencyBonus)
    : abilityModifier + proficiencyBonus;
  const spellSaveDC = spellcasting.spellSaveDC
    ? spellcasting.spellSaveDC(character.abilityScores, proficiencyBonus)
    : 8 + abilityModifier + proficiencyBonus;

  const lines: StatLine[] = [
    { label: `${ABILITY_LABELS[spellcasting.ability]} modifier`, value: formatSigned(abilityModifier) },
    { label: "Proficiency bonus", value: formatSigned(proficiencyBonus) },
    { label: "Spell attack bonus", value: `${formatSigned(abilityModifier)} + ${formatSigned(proficiencyBonus)} = ${formatSigned(spellAttackBonus)}` },
    { label: "Spell save DC", value: `8 + ${formatSigned(abilityModifier)} + ${formatSigned(proficiencyBonus)} = ${spellSaveDC}` },
  ];

  return {
    className: entry.class.name,
    ability: spellcasting.ability,
    abilityLabel: ABILITY_LABELS[spellcasting.ability],
    abilityModifier,
    proficiencyBonus,
    spellAttackBonus,
    spellSaveDC,
    lines,
  };
}
