import { AbilityScores, Character, getCharacterLevel } from "@/interfaces/Characters";
import { ClassFeature } from "@/interfaces/CharacterClass";
import { SkillName, SKILL_ABILITIES } from "@/interfaces/Skill";
import { Spell, SpellMechanics } from "@/interfaces/Spell";
import { Weapon } from "@/interfaces/Weapon";
import { calculateAbilityModifiers } from "@/utils/abilityModifiers";
import { calculateArmorClass } from "@/utils/calculateArmorClass";
import { calculateProficiencyBonus } from "@/utils/calculateProficiencyBonus";
import { getHitDicePools, getSheetMaxHp } from "@/utils/hitDice";
import {
  getSpellcastingInfo,
  getUnarmedStrikeWeapon,
  getWeaponAttackInfo,
  getWeaponDamageInfo,
  isProficientWithWeapon,
} from "@/utils/attackCalculations";
import { getPactMagicSlots, getSpellSlots } from "@/utils/spellcasting";
import { fallbackMechanics, formatScaledRoll, getScaledSpellRolls } from "@/utils/spellRolls";
import { isWeaponMasteryActive } from "@/utils/weaponMastery";
import {
  ABILITY_ORDER,
  SKILL_LIST,
  classAndLevelLabel,
  isProficientInSave,
  isProficientInSkill,
  saveModifier,
  skillModifier,
} from "@/utils/characterSheetHelpers";
import { decodeFeatureChoiceSelection, featureChoiceKey } from "@/utils/grantedSpells";
import { getEquippedArmor, getEquippedShield } from "@/utils/armor";

/**
 * Bumped whenever the shape below changes in a way the browser extension's
 * Roll20 mapper has to know about. The extension checks it and refuses a
 * payload newer than it understands instead of half-importing it.
 */
export const ROLL20_EXPORT_VERSION = 1;

export type Ability = keyof AbilityScores;

export interface Roll20AbilityExport {
  score: number;
  mod: number;
  saveProficient: boolean;
  save: number;
}

export interface Roll20SkillExport {
  name: SkillName;
  ability: Ability;
  proficient: boolean;
  bonus: number;
}

export interface Roll20AttackExport {
  name: string;
  /** "melee" / "ranged" - thrown melee weapons stay "melee". */
  type: "melee" | "ranged";
  ability: Ability;
  proficient: boolean;
  /** Final to-hit bonus: ability + PB (if proficient) + magic + items + fighting style. */
  attackBonus: number;
  /** Dice only, e.g. "1d8". */
  damageDice: string;
  /** Flat part added to the dice: ability + magic + items + fighting style. */
  damageBonus: number;
  /** Ready-to-roll formula, e.g. "1d8+3". */
  damage: string;
  damageType: string;
  /** Two-handed formula for versatile weapons, e.g. "1d10+3". */
  versatileDamage?: string;
  properties: string[];
  mastery?: string;
  masteryActive: boolean;
  magicBonus: number;
  description?: string;
  isUnarmedStrike: boolean;
}

export interface Roll20SpellRollExport {
  kind: "damage" | "healing" | "effect";
  label?: string;
  /** Formula at the spell's base level with the spellcasting modifier folded in where the spell adds it. */
  formula: string;
  damageType?: string;
}

export interface Roll20SpellExport {
  name: string;
  /** 0 = cantrip. */
  level: number;
  school: string;
  castingTime: string;
  range: string;
  components: string[];
  duration: string;
  ritual: boolean;
  concentration: boolean;
  description: string;
  attack?: "melee" | "ranged";
  save?: Ability;
  rolls: Roll20SpellRollExport[];
  upcastNote?: string;
  /** Granted for free by a class/subclass feature rather than picked. */
  granted: boolean;
}

export interface Roll20FeatureExport {
  name: string;
  source: "class" | "subclass" | "species" | "background" | "feat";
  /** e.g. "Fighter", "Champion", "Elf", "Soldier". */
  sourceName: string;
  level?: number;
  description: string;
}

export interface Roll20InventoryExport {
  name: string;
  quantity: number;
  weight?: number;
  category: string;
  equipped: boolean;
  description?: string;
}

export interface Roll20SlotExport {
  level: number;
  max: number;
  expended: number;
}

export interface Roll20Export {
  version: typeof ROLL20_EXPORT_VERSION;
  /** This app's character id - lets the extension remember which Roll20 character it created. */
  sheetCharacterId: string;
  exportedAt: string;
  edition: Character["edition"];
  name: string;
  playerName?: string;
  alignment: string;
  species: { name: string; speed: number };
  background: { name: string; toolProficiency?: string; originFeat?: string };
  level: number;
  classSummary: string;
  classes: { name: string; subclass?: string; level: number; hitDie: number }[];
  abilities: Record<Ability, Roll20AbilityExport>;
  proficiencyBonus: number;
  initiative: number;
  speed: number;
  armorClass: number;
  armorWorn?: string;
  shieldWorn?: string;
  passive: { perception: number; insight: number; investigation: number };
  hp: { current: number; max: number };
  hitDice: { die: number; total: number; remaining: number }[];
  skills: Roll20SkillExport[];
  proficiencies: { armor: string[]; weapons: string[]; tools: string[]; languages: string[]; notes?: string };
  attacks: Roll20AttackExport[];
  spellcasting: { className: string; ability: Ability; abilityMod: number; attackBonus: number; saveDC: number } | null;
  spellSlots: Roll20SlotExport[];
  pactSlots: Roll20SlotExport[];
  spells: Roll20SpellExport[];
  features: Roll20FeatureExport[];
  inventory: Roll20InventoryExport[];
  magicItems: {
    name: string;
    category: string;
    rarity: string;
    requiresAttunement: boolean | string;
    description: string;
    chargesMax?: number;
    recharge?: string;
  }[];
  currency: { cp: number; sp: number; ep: number; gp: number; pp: number };
  trackers: {
    inspiration: boolean;
    deathSaves: { successes: number; failures: number };
    conditions: string[];
    exhaustion: number;
    concentratingOn?: string;
  };
  details: {
    personalityTraits?: string;
    ideals?: string;
    bonds?: string;
    flaws?: string;
    age?: string;
    height?: string;
    weight?: string;
    eyes?: string;
    skin?: string;
    hair?: string;
    appearance?: string;
    backstory?: string;
    alliesAndOrganizations?: string;
    organizationSymbolName?: string;
    additionalFeaturesAndTraits?: string;
    treasure?: string;
    featuresAndTraitsNotes?: string;
  };
}

/** The HP-only message streamed after a character has been synced once. */
export interface Roll20HpUpdate {
  sheetCharacterId: string;
  name: string;
  current: number;
  max: number;
}

function formula(dice: string, bonus: number): string {
  if (!bonus) return dice;
  return `${dice}${bonus > 0 ? "+" : "-"}${Math.abs(bonus)}`;
}

function describeWeapon(weapon: Weapon): string | undefined {
  const parts: string[] = [];
  if (weapon.properties.length > 0) parts.push(`Properties: ${weapon.properties.join(", ")}`);
  if (weapon.mastery) parts.push(`Mastery: ${weapon.mastery}`);
  if (weapon.magicDescription) parts.push(weapon.magicDescription);
  return parts.length > 0 ? parts.join("\n") : undefined;
}

function buildAttack(character: Character, weapon: Weapon, masteryActive: boolean): Roll20AttackExport {
  const attack = getWeaponAttackInfo(character, weapon);
  const damage = getWeaponDamageInfo(character, weapon);
  const versatile = weapon.versatileDamage ? getWeaponDamageInfo(character, weapon, true) : undefined;
  return {
    name: weapon.name,
    type: weapon.type,
    ability: attack.ability,
    proficient: isProficientWithWeapon(character, weapon),
    attackBonus: attack.attackBonus,
    damageDice: damage.diceFormula,
    damageBonus: damage.flatBonus,
    damage: formula(damage.diceFormula, damage.flatBonus),
    damageType: damage.damageType,
    versatileDamage: versatile ? formula(versatile.diceFormula, versatile.flatBonus) : undefined,
    properties: [...weapon.properties],
    mastery: weapon.mastery,
    masteryActive,
    magicBonus: weapon.bonus ?? 0,
    description: describeWeapon(weapon),
    isUnarmedStrike: Boolean(weapon.isUnarmedStrike),
  };
}

/** Same choice resolution the sheet's Features tab applies (see page.tsx's `resolveFeatureChoice`). */
function featureDescription(feature: ClassFeature, classIndex: number, featureChoices: Record<string, string> | undefined) {
  if (!feature.choice) return feature.description;
  const selected = decodeFeatureChoiceSelection(featureChoices?.[featureChoiceKey(classIndex, feature)]);
  const chosen = feature.choice.options.filter((option) => selected.includes(option.id));
  if (chosen.length === 0) return feature.description;
  const lines = chosen.map((option) => `${option.label}${option.summary ? ` — ${option.summary}` : ""}`).join("\n");
  return `${feature.description}\n\nChosen: ${lines}`;
}

/** "Darkvision. You can see..." / "Darkvision: You can..." -> name + description; a bare trait name keeps an empty description. */
function splitTrait(trait: string): { name: string; description: string } {
  const match = trait.match(/^([^.:]{1,60})[.:]\s+([\s\S]+)$/);
  return match ? { name: match[1].trim(), description: match[2].trim() } : { name: trait.trim(), description: "" };
}

function buildSpell(
  spell: Spell,
  granted: boolean,
  mechanics: SpellMechanics,
  characterLevel: number,
  spellMod: number | null
): Roll20SpellExport {
  const rolls = getScaledSpellRolls(mechanics, {
    spellLevel: spell.level,
    castLevel: spell.level,
    characterLevel,
  }).map((roll) => ({
    kind: roll.kind,
    label: roll.source.label,
    formula: formatScaledRoll(roll, spellMod),
    damageType: roll.source.damageType,
  }));
  return {
    name: spell.name,
    level: spell.level,
    school: spell.school,
    castingTime: spell.castingTime,
    range: spell.range,
    components: [...spell.components],
    duration: spell.duration,
    ritual: spell.ritual,
    concentration: spell.concentration,
    description: spell.description,
    attack: mechanics.attack,
    save: mechanics.save,
    rolls,
    upcastNote: mechanics.upcastNote,
    granted,
  };
}

function slotList(max: Record<number, number> | null, expended: Record<number, number> | undefined): Roll20SlotExport[] {
  if (!max) return [];
  return Object.entries(max)
    .map(([level, count]) => ({
      level: Number(level),
      max: count ?? 0,
      expended: Math.min(count ?? 0, Math.max(0, expended?.[Number(level)] ?? 0)),
    }))
    .filter((slot) => slot.max > 0)
    .sort((a, b) => a.level - b.level);
}

/**
 * Everything the character sheet knows about `character`, flattened into
 * final numbers and plain text for the "Sync with Roll20" button. It is
 * deliberately Roll20-agnostic: which Roll20 attribute or sheet section each
 * value lands in is decided by the browser extension's mapper, so a Roll20
 * sheet update only ever means changing the extension, not this app.
 *
 * `resolveSpellMechanics` is the page's compendium lookup (see
 * `useSpellMechanicsLookup`) - stored spell copies may predate their
 * structured roll data. Without it each spell's own copy is used, falling
 * back to dice pulled from its description.
 */
export function buildRoll20Export(
  character: Character & { id: string },
  resolveSpellMechanics?: (spell: Spell) => SpellMechanics
): Roll20Export {
  const modifiers = calculateAbilityModifiers(character.abilityScores);
  const pb = calculateProficiencyBonus(character);
  const level = getCharacterLevel(character);
  const details = character.details ?? {};
  const spellcasting = getSpellcastingInfo(character);
  const mechanicsFor = (spell: Spell) => resolveSpellMechanics?.(spell) ?? spell.mechanics ?? fallbackMechanics(spell);

  const abilities = Object.fromEntries(
    ABILITY_ORDER.map((ability) => [
      ability,
      {
        score: character.abilityScores[ability],
        mod: modifiers[ability],
        saveProficient: isProficientInSave(character, ability),
        save: saveModifier(character, ability, modifiers, pb),
      },
    ])
  ) as Record<Ability, Roll20AbilityExport>;

  const skills: Roll20SkillExport[] = SKILL_LIST.map((skill) => ({
    name: skill,
    ability: SKILL_ABILITIES[skill],
    proficient: isProficientInSkill(character, skill),
    bonus: skillModifier(character, skill, modifiers, pb),
  }));

  const armorProfs = new Set<string>();
  const weaponProfs = new Set<string>();
  const toolProfs = new Set<string>();
  character.classes.forEach((entry, index) => {
    const profs = index === 0 ? entry.class.proficiencies : entry.class.multiclassProficiencies ?? {};
    profs.armor?.forEach((value) => armorProfs.add(value));
    profs.weapons?.forEach((value) => weaponProfs.add(value));
    profs.tools?.forEach((value) => toolProfs.add(value));
  });
  if (character.background.toolProficiency) toolProfs.add(character.background.toolProficiency);

  const attacks: Roll20AttackExport[] = [
    buildAttack(character, getUnarmedStrikeWeapon(character), false),
    ...character.weapons.map((weapon, index) => buildAttack(character, weapon, isWeaponMasteryActive(character, index))),
  ];

  const features: Roll20FeatureExport[] = [];
  character.classes.forEach((entry, classIndex) => {
    for (const feature of entry.class.features ?? []) {
      if (feature.level > entry.level) continue;
      features.push({
        name: feature.name,
        source: "class",
        sourceName: entry.class.name,
        level: feature.level,
        description: featureDescription(feature, classIndex, character.featureChoices),
      });
    }
    for (const feature of entry.subclass?.features ?? []) {
      if (feature.level > entry.level) continue;
      features.push({
        name: feature.name,
        source: "subclass",
        sourceName: entry.subclass!.name,
        level: feature.level,
        description: featureDescription(feature, classIndex, character.featureChoices),
      });
    }
  });
  for (const trait of character.race.traits ?? []) {
    features.push({ ...splitTrait(trait), source: "species", sourceName: character.race.name });
  }
  if (character.background.feature) {
    features.push({
      name: character.background.feature.name,
      source: "background",
      sourceName: character.background.name,
      description: character.background.feature.description,
    });
  }
  for (const feat of character.feats) {
    features.push({
      name: feat.name,
      source: "feat",
      sourceName: feat.category,
      description: feat.prerequisite ? `Prerequisite: ${feat.prerequisite}\n\n${feat.description}` : feat.description,
    });
  }

  const spellMod = spellcasting?.abilityModifier ?? null;
  const knownNames = new Set(character.spellsKnown.map((spell) => spell.name));
  const spells: Roll20SpellExport[] = [
    ...character.spellsKnown.map((spell) => buildSpell(spell, false, mechanicsFor(spell), level, spellMod)),
    ...(character.grantedSpells ?? [])
      .filter((spell) => !knownNames.has(spell.name))
      .map((spell) => buildSpell(spell, true, mechanicsFor(spell), level, spellMod)),
  ].sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));

  const inventory: Roll20InventoryExport[] = [
    ...(character.armors ?? []).map((armor) => ({
      name: armor.name,
      quantity: 1,
      weight: armor.weight,
      category: armor.category === "shield" ? "shield" : `${armor.category} armor`,
      equipped: Boolean(armor.equipped),
      description: [
        armor.category === "shield" ? `+${armor.baseAC} AC` : `AC ${armor.baseAC}`,
        armor.bonus ? `Magic +${armor.bonus}` : null,
        armor.stealthDisadvantage ? "Stealth disadvantage" : null,
        armor.magicDescription ?? null,
      ]
        .filter(Boolean)
        .join("\n"),
    })),
    ...character.weapons.map((weapon) => ({
      name: weapon.name,
      quantity: 1,
      weight: weapon.weight,
      category: `${weapon.category} ${weapon.type} weapon`,
      equipped: true,
      description: describeWeapon(weapon),
    })),
    ...(character.inventory ?? []).map((entry) => ({
      name: entry.item.name,
      quantity: entry.quantity,
      weight: entry.item.weight,
      category: entry.item.category,
      equipped: false,
      description: entry.item.description,
    })),
  ];

  const armorWorn = getEquippedArmor(character);
  const shieldWorn = getEquippedShield(character);

  return {
    version: ROLL20_EXPORT_VERSION,
    sheetCharacterId: character.id,
    exportedAt: new Date().toISOString(),
    edition: character.edition,
    name: character.name,
    playerName: details.playerName,
    alignment: character.alignment,
    species: { name: character.race.name, speed: character.race.speed },
    background: {
      name: character.background.name,
      toolProficiency: character.background.toolProficiency,
      originFeat: character.background.originFeat,
    },
    level,
    classSummary: classAndLevelLabel(character),
    classes: character.classes.map((entry) => ({
      name: entry.class.name,
      subclass: entry.subclass?.name,
      level: entry.level,
      hitDie: entry.class.hitDie,
    })),
    abilities,
    proficiencyBonus: pb,
    // The stored `initiative` is only set once at creation, so the live Dex
    // modifier is what the sheet's own breakdown treats as current.
    initiative: modifiers.dexterity,
    speed: character.race.speed,
    armorClass: calculateArmorClass(character),
    armorWorn: armorWorn?.name,
    shieldWorn: shieldWorn?.name,
    passive: {
      perception: 10 + skillModifier(character, "Perception", modifiers, pb),
      insight: 10 + skillModifier(character, "Insight", modifiers, pb),
      investigation: 10 + skillModifier(character, "Investigation", modifiers, pb),
    },
    hp: { current: character.currentHP, max: getSheetMaxHp(character) },
    hitDice: getHitDicePools(character).map((pool) => ({ die: pool.hitDie, total: pool.total, remaining: pool.remaining })),
    skills,
    proficiencies: {
      armor: [...armorProfs],
      weapons: [...weaponProfs],
      tools: [...toolProfs],
      languages: [...character.languages],
      notes: details.otherProficienciesNotes,
    },
    attacks,
    spellcasting: spellcasting
      ? {
          className: spellcasting.className,
          ability: spellcasting.ability,
          abilityMod: spellcasting.abilityModifier,
          attackBonus: spellcasting.spellAttackBonus,
          saveDC: spellcasting.spellSaveDC,
        }
      : null,
    spellSlots: slotList(getSpellSlots(character), details.expendedSpellSlots),
    pactSlots: slotList(getPactMagicSlots(character), details.expendedPactSlots),
    spells,
    features,
    inventory,
    magicItems: (character.magicItems ?? []).map((item) => ({
      name: item.name,
      category: item.category,
      rarity: item.rarity,
      requiresAttunement: item.requiresAttunement,
      description: item.description,
      chargesMax: item.charges?.max,
      recharge: item.charges?.rechargeFormula,
    })),
    currency: {
      cp: character.currency.copper,
      sp: character.currency.silver,
      ep: character.currency.electrum,
      gp: character.currency.gold,
      pp: character.currency.platinum,
    },
    trackers: {
      inspiration: Boolean(details.inspiration),
      deathSaves: { successes: details.deathSaves?.successes ?? 0, failures: details.deathSaves?.failures ?? 0 },
      conditions: [...(details.conditions ?? [])],
      exhaustion: details.exhaustionLevel ?? 0,
      concentratingOn: details.concentratingOn,
    },
    details: {
      ...details.flavor,
      ...details.appearance,
      appearance: details.appearanceNotes,
      backstory: details.backstory,
      alliesAndOrganizations: details.alliesAndOrganizations,
      organizationSymbolName: details.organizationSymbolName,
      additionalFeaturesAndTraits: details.additionalFeaturesAndTraits,
      treasure: details.treasure,
      featuresAndTraitsNotes: details.featuresAndTraitsNotes,
    },
  };
}

export function buildRoll20HpUpdate(character: Character & { id: string }): Roll20HpUpdate {
  return {
    sheetCharacterId: character.id,
    name: character.name,
    current: character.currentHP,
    max: getSheetMaxHp(character),
  };
}
