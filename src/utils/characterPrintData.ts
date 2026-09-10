import { Character } from "@/interfaces/Characters";
import { Weapon } from "@/interfaces/Weapon";
import { AbilityModifiers, calculateAbilityModifiers } from "@/utils/abilityModifiers";
import { calculateArmorClass } from "@/utils/calculateArmorClass";
import { calculateProficiencyBonus } from "@/utils/calculateProficiencyBonus";
import { getPactMagicSlots, getSpellSlots } from "@/utils/spellcasting";
import { getUnarmedStrikeWeapon } from "@/utils/attackCalculations";
import {
  classAndLevelLabel,
  formatMod,
  groupSpellsByLevel,
  hitDiceLabel,
  isSpellcaster,
  primarySpellcastingEntry,
  skillModifier,
} from "@/utils/characterSheetHelpers";

/**
 * Weapon's attack-roll ability modifier: DEX for ranged weapons, the better
 * of STR/DEX for finesse, STR otherwise. Deliberately not
 * `utils/attackCalculations.ts`'s `getWeaponAbility()` - that returns the
 * ability NAME, not the resolved modifier value, and every caller here wants
 * the number directly. Same helper the print page used before this file
 * existed, just relocated so the PDF exporter (no React tree to memoize in)
 * can share it too.
 */
function weaponAbilityModifier(weapon: Weapon, modifiers: AbilityModifiers): number {
  if (weapon.type === "ranged") return modifiers.dexterity;
  if (weapon.properties.includes("finesse")) return Math.max(modifiers.strength, modifiers.dexterity);
  return modifiers.strength;
}

export type AttackLine = { name: string; atkBonus: number; damageText: string };

/**
 * Every value the printable character sheet (app/character/[id]/print) and
 * the fillable-PDF export (utils/pdfExport) both need, computed once from a
 * `Character` so the two output formats can never drift out of sync. This
 * used to live inline in the print page's own `useMemo`; it moved here so
 * `exportCharacterToPdf` - which has no component to hook a memo into - can
 * call the exact same derivation instead of re-implementing it.
 */
export function derivePrintData(character: Character) {
  const modifiers = calculateAbilityModifiers(character.abilityScores);
  const proficiencyBonus = calculateProficiencyBonus(character);
  const ac = calculateArmorClass(character);
  const passivePerception = 10 + skillModifier(character, "Perception", modifiers, proficiencyBonus);
  const details = character.details ?? {};

  const armorProficiencies = new Set<string>();
  const weaponProficiencies = new Set<string>();
  const toolProficiencies = new Set<string>();
  character.classes.forEach((entry, index) => {
    const profs = index === 0 ? entry.class.proficiencies : entry.class.multiclassProficiencies ?? {};
    profs.armor?.forEach((a) => armorProficiencies.add(a));
    profs.weapons?.forEach((w) => weaponProficiencies.add(w));
    profs.tools?.forEach((t) => toolProficiencies.add(t));
  });
  if (character.background.toolProficiency) toolProficiencies.add(character.background.toolProficiency);

  // Spell save DC / attack bonus use the universal RAW formula (8/0 + prof
  // bonus + spellcasting ability modifier) rather than each class's own
  // `spellcasting.spellSaveDC`/`spellAttackBonus` functions - none of the
  // class data in this app actually implements those optional fields, so
  // relying on them would leave this always blank.
  const spellEntry = primarySpellcastingEntry(character);
  const spellAbility = spellEntry?.class.spellcasting?.ability;
  const spellSaveDC = spellAbility !== undefined ? 8 + proficiencyBonus + modifiers[spellAbility] : undefined;
  const spellAttackBonus = spellAbility !== undefined ? proficiencyBonus + modifiers[spellAbility] : undefined;

  const sharedSlots = getSpellSlots(character) ?? {};
  const pactSlots = getPactMagicSlots(character) ?? {};
  const slotsByLevel: Record<number, number> = {};
  for (let level = 1; level <= 9; level++) {
    const total = (sharedSlots[level] ?? 0) + (pactSlots[level] ?? 0);
    if (total > 0) slotsByLevel[level] = total;
  }

  // Includes `grantedSpells` (auto-granted by a class/subclass feature -
  // see utils/grantedSpells.ts) alongside `spellsKnown` - the printed
  // sheet has no separate "free spells" section, and a granted spell is
  // just as much a spell the character can cast as anything picked on
  // the Spells step, so it belongs on this list too rather than being
  // silently left off the printed character sheet.
  const spellGroups = groupSpellsByLevel([...character.spellsKnown, ...(character.grantedSpells ?? [])]);

  const featureLines = [
    ...character.classes.flatMap((entry) =>
      (entry.subclass?.features ?? [])
        .filter((feature) => feature.level <= entry.level)
        .map((feature) => feature.name)
    ),
    ...character.feats.map((feat) => feat.name),
  ];

  const unarmedStrike = getUnarmedStrikeWeapon(character);
  const unarmedAbilityMod = weaponAbilityModifier(unarmedStrike, modifiers);
  const attacks: AttackLine[] = [
    {
      name: unarmedStrike.name,
      atkBonus: unarmedAbilityMod + proficiencyBonus,
      damageText: `${unarmedStrike.damage.dice}${
        unarmedAbilityMod !== 0 ? formatMod(unarmedAbilityMod) : ""
      } ${unarmedStrike.damage.type}`,
    },
    ...character.weapons.map((weapon) => {
      const abilityMod = weaponAbilityModifier(weapon, modifiers);
      const atkBonus = abilityMod + proficiencyBonus + (weapon.bonus ?? 0);
      const damageMod = abilityMod + (weapon.bonus ?? 0);
      return {
        name: weapon.name,
        atkBonus,
        damageText: `${weapon.damage.dice}${damageMod !== 0 ? formatMod(damageMod) : ""} ${weapon.damage.type}`,
      };
    }),
  ];

  const equipmentLines = [
    character.equippedArmor ? character.equippedArmor.name : null,
    character.shield ? character.shield.name : null,
    ...(character.magicItems ?? []).map((item) => item.name),
  ].filter(Boolean) as string[];

  const otherProficienciesText = [
    armorProficiencies.size > 0 ? `Armor: ${[...armorProficiencies].join(", ")}` : null,
    weaponProficiencies.size > 0 ? `Weapons: ${[...weaponProficiencies].join(", ")}` : null,
    toolProficiencies.size > 0 ? `Tools: ${[...toolProficiencies].join(", ")}` : null,
    character.languages.length > 0 ? `Languages: ${character.languages.join(", ")}` : null,
    details.otherProficienciesNotes || null,
  ]
    .filter(Boolean)
    .join("\n");

  const featuresText = [featureLines.join(", "), details.featuresAndTraitsNotes].filter(Boolean).join("\n\n");

  return {
    modifiers,
    proficiencyBonus,
    ac,
    passivePerception,
    details,
    armorProficiencies: [...armorProficiencies],
    weaponProficiencies: [...weaponProficiencies],
    toolProficiencies: [...toolProficiencies],
    spellAbility,
    spellSaveDC,
    spellAttackBonus,
    spellClassName: spellEntry?.class.name,
    slotsByLevel,
    spellGroups,
    featureLines,
    showSpellSheet: isSpellcaster(character),
    attacks,
    equipmentLines,
    otherProficienciesText,
    featuresText,
    classAndLevel: classAndLevelLabel(character),
    hitDice: hitDiceLabel(character),
  };
}

export type CharacterPrintData = ReturnType<typeof derivePrintData>;
