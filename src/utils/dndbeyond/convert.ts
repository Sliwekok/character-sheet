import { Edition } from "@/interfaces/Edition";
import { AbilityScores, CharacterClassLevel } from "@/interfaces/Characters";
import { StoredCharacter } from "@/interfaces/StoredCharacter";
import { Currency } from "@/interfaces/Currency";
import { CharacterAppearance, CharacterDetails, CharacterFlavor } from "@/interfaces/CharacterDetails";
import { MagicItem, MagicItemCategory, MagicItemRarity } from "@/interfaces/MagicItem";
import { Weapon } from "@/interfaces/Weapon";
import { Armor } from "@/interfaces/Armor";
import { Ruleset, getRulesetAsync } from "@/data";
import { generateId } from "@/utils/id";
import { enchantArmor, enchantWeapon, createCustomMagicItem } from "@/utils/customMagicItems";

import { DdbCharacterData, DdbClassEntry, DdbGrantedModifier, DdbInventoryItem } from "./types";
import { findByName } from "./matchCompendium";
import { htmlToPlainText } from "./textUtils";
import { hasReadableModifiers, readAbilityScoreBonuses, readSkillProficiencies } from "./readModifiers";

export interface ConvertResult {
  character: StoredCharacter;
  warnings: string[];
  edition: Edition;
}

export type ConvertOutcome = ConvertResult | { error: string };

function isConvertError(outcome: ConvertOutcome): outcome is { error: string } {
  return "error" in outcome;
}

const ALIGNMENT_NAMES: Record<number, string> = {
  1: "Lawful Good",
  2: "Neutral Good",
  3: "Chaotic Good",
  4: "Lawful Neutral",
  5: "Neutral",
  6: "Chaotic Neutral",
  7: "Lawful Evil",
  8: "Neutral Evil",
  9: "Chaotic Evil",
};

const ABILITY_ORDER: (keyof AbilityScores)[] = [
  "strength",
  "dexterity",
  "constitution",
  "intelligence",
  "wisdom",
  "charisma",
];

const WEAPON_BONUS_SUBTYPES = ["magic", "weapon-attacks", "weapon-damage", "weapon-attack-and-damage-rolls"];
const ARMOR_BONUS_SUBTYPES = ["armor-class"];

const MAGIC_ITEM_CATEGORY_BY_FILTER_TYPE: Record<string, MagicItemCategory> = {
  "Wondrous Item": "wondrous item",
  Ring: "ring",
  Rod: "rod",
  Staff: "staff",
  Wand: "wand",
  Potion: "potion",
  Scroll: "scroll",
  Ammunition: "ammunition",
};

function raceDisplayName(data: DdbCharacterData): string | undefined {
  return data.race?.fullName || data.race?.baseRaceName || undefined;
}

/** Sum of every `type: "bonus"` grant in `modifiers` whose `subType` is one of `subtypes` - the flat "+N" this app's Weapon/Armor `bonus` field wants. Anything the grant does mechanically beyond a flat number (extra elemental damage, etc.) isn't captured here - see this folder's README "Best effort" section. */
function extractFlatBonus(modifiers: DdbGrantedModifier[] | undefined, subtypes: string[]): number {
  if (!modifiers) return 0;
  return modifiers
    .filter((modifier) => modifier.type === "bonus" && modifier.subType && subtypes.includes(modifier.subType))
    .reduce((sum, modifier) => sum + (modifier.value ?? modifier.fixedValue ?? 0), 0);
}

function rarityFromDdb(rarity: string | undefined): MagicItemRarity {
  const normalized = (rarity ?? "").toLowerCase();
  const known: MagicItemRarity[] = ["common", "uncommon", "rare", "very rare", "legendary", "artifact", "varies"];
  return (known as string[]).includes(normalized) ? (normalized as MagicItemRarity) : "varies";
}

function attunementFromDdb(item: DdbInventoryItem): boolean | string {
  const description = item.definition.attunementDescription?.trim();
  if (description) return description;
  return !!item.definition.canAttune;
}

/** One equipped weapon -> this app's `Weapon`, matched against the base mundane weapon by D&D Beyond's `type` (e.g. "Greatsword") and, if magic, layered with `enchantWeapon`. `undefined` (plus a warning) when the base type isn't in this app's weapon table at all - homebrew weapons aren't supported. */
function mapWeapon(item: DdbInventoryItem, ruleset: Ruleset, warnings: string[]): Weapon | undefined {
  const def = item.definition;
  const baseName = def.type ?? undefined;
  const base = findByName(ruleset.weapons, baseName);

  if (!base) {
    warnings.push(
      `Couldn't match equipped weapon "${def.name}" to a base weapon type in this app's compendium` +
        (baseName ? ` ("${baseName}")` : "") +
        " - add it to the sheet by hand.",
    );
    return undefined;
  }

  if (!def.magic) return base;

  return enchantWeapon(base, {
    nameOverride: def.name,
    bonus: extractFlatBonus(def.grantedModifiers, WEAPON_BONUS_SUBTYPES) || undefined,
    rarity: rarityFromDdb(def.rarity),
    requiresAttunement: attunementFromDdb(item),
    magicDescription: htmlToPlainText(def.description),
  });
}

/** One equipped armor/shield item -> this app's `Armor`, same base-match-then-enchant approach as `mapWeapon`. */
function mapArmor(item: DdbInventoryItem, ruleset: Ruleset, warnings: string[]): Armor | undefined {
  const def = item.definition;
  const baseName = def.baseArmorName || def.type || undefined;
  const base = findByName(ruleset.armor, baseName);

  if (!base) {
    warnings.push(
      `Couldn't match equipped armor "${def.name}" to a base armor type in this app's compendium` +
        (baseName ? ` ("${baseName}")` : "") +
        " - add it to the sheet by hand.",
    );
    return undefined;
  }

  if (!def.magic) return base;

  return enchantArmor(base, {
    nameOverride: def.name,
    bonus: extractFlatBonus(def.grantedModifiers, ARMOR_BONUS_SUBTYPES) || undefined,
    rarity: rarityFromDdb(def.rarity),
    requiresAttunement: attunementFromDdb(item),
    magicDescription: htmlToPlainText(def.description),
  });
}

/** A non-armor/non-weapon magic item (wondrous item, ring, rod, staff, wand, potion, scroll) -> this app's `MagicItem`, matched by name against the compendium first, falling back to a synthesized custom entry built from D&D Beyond's own description/rarity/attunement so nothing equipped/attuned is silently dropped. */
function mapMagicItem(item: DdbInventoryItem, ruleset: Ruleset): MagicItem {
  const def = item.definition;
  const existing = findByName(ruleset.magicItems, def.name);
  if (existing) return existing;

  const category = (def.filterType && MAGIC_ITEM_CATEGORY_BY_FILTER_TYPE[def.filterType]) || "other";
  return createCustomMagicItem({
    name: def.name,
    category,
    rarity: rarityFromDdb(def.rarity),
    requiresAttunement: attunementFromDdb(item),
    description: htmlToPlainText(def.description) || "Imported from D&D Beyond - description unavailable.",
  });
}

/** Determines which ruleset (2014 vs 2024 content) best matches this character's race/background/classes by name, since D&D Beyond's own payload doesn't label its ruleset version directly. Ties favor 2024 (D&D Beyond's current default for new characters). */
async function detectEdition(data: DdbCharacterData): Promise<Edition> {
  const [ruleset2014, ruleset2024] = await Promise.all([getRulesetAsync("2014"), getRulesetAsync("2024")]);

  const scoreOf = (ruleset: Ruleset): number => {
    let score = 0;
    if (findByName(ruleset.races, raceDisplayName(data))) score += 1;
    if (findByName(ruleset.backgrounds, data.background?.definition?.name)) score += 1;
    for (const entry of data.classes) {
      if (findByName(ruleset.classes, entry.definition?.name)) score += 1;
    }
    return score;
  };

  return scoreOf(ruleset2024) >= scoreOf(ruleset2014) ? "2024" : "2014";
}

function abilityScores(data: DdbCharacterData, bonuses: Partial<AbilityScores>): AbilityScores {
  const result = {} as AbilityScores;

  ABILITY_ORDER.forEach((key, index) => {
    const id = index + 1;
    const override = data.overrideStats?.find((stat) => stat.id === id)?.value;
    if (override != null) {
      result[key] = override;
      return;
    }

    const base = data.stats.find((stat) => stat.id === id)?.value ?? 10;
    const manualBonus = data.bonusStats?.find((stat) => stat.id === id)?.value ?? 0;
    result[key] = base + manualBonus + (bonuses[key] ?? 0);
  });

  return result;
}

function buildDetails(data: DdbCharacterData): CharacterDetails | undefined {
  const details: CharacterDetails = {};

  if (data.inspiration) details.inspiration = true;

  const appearance: CharacterAppearance = {};
  if (data.age != null && data.age !== "") appearance.age = String(data.age);
  if (data.height) appearance.height = data.height;
  if (data.weight != null && data.weight !== "") appearance.weight = String(data.weight);
  if (data.eyes) appearance.eyes = data.eyes;
  if (data.skin) appearance.skin = data.skin;
  if (data.hair) appearance.hair = data.hair;
  if (Object.keys(appearance).length > 0) details.appearance = appearance;

  const flavor: CharacterFlavor = {};
  if (data.traits?.personalityTraits) flavor.personalityTraits = htmlToPlainText(data.traits.personalityTraits);
  if (data.traits?.ideals) flavor.ideals = htmlToPlainText(data.traits.ideals);
  if (data.traits?.bonds) flavor.bonds = htmlToPlainText(data.traits.bonds);
  if (data.traits?.flaws) flavor.flaws = htmlToPlainText(data.traits.flaws);
  if (Object.keys(flavor).length > 0) details.flavor = flavor;

  if (data.traits?.appearance) details.appearanceNotes = htmlToPlainText(data.traits.appearance);
  if (data.notes?.backstory) details.backstory = htmlToPlainText(data.notes.backstory);

  const alliesText = [data.notes?.allies, data.notes?.organizations].filter(Boolean).map((t) => htmlToPlainText(t));
  if (alliesText.length > 0) details.alliesAndOrganizations = alliesText.join("\n\n");

  const treasureText = [data.notes?.personalPossessions, data.notes?.otherHoldings]
    .filter(Boolean)
    .map((t) => htmlToPlainText(t));
  if (treasureText.length > 0) details.treasure = treasureText.join("\n\n");

  if (data.notes?.enemies) {
    details.additionalFeaturesAndTraits = htmlToPlainText(data.notes.enemies);
  }

  return Object.keys(details).length > 0 ? details : undefined;
}

/**
 * Converts one D&D Beyond character JSON payload (`data`, the `data` object
 * inside the API response - see types.ts) into a `StoredCharacter` this
 * app's own "Import" screen can load, matching every race/class/subclass/
 * background/feat/weapon/armor by name against this app's own bundled
 * compendium (`@/data`) rather than fabricating new compendium entries -
 * see this folder's README for what that means for homebrew content.
 *
 * Never throws: an unrecoverable problem (missing name/classes, or a race/
 * class/background this app doesn't have) comes back as `{ error }`;
 * anything recoverable-but-uncertain (ability score bonuses, skill
 * proficiencies, spells, equipment that couldn't be matched) is silently
 * best-effort'd and reported in `warnings` instead, so a character with
 * some homebrew gear still imports rather than failing outright.
 */
export async function convertDndBeyondCharacter(
  data: DdbCharacterData,
  editionOverride?: Edition,
): Promise<ConvertOutcome> {
  const warnings: string[] = [];

  if (!data.name?.trim()) {
    return { error: "This character has no name - is it fully created on D&D Beyond?" };
  }
  if (!Array.isArray(data.classes) || data.classes.length === 0) {
    return { error: "This character has no classes - is it fully created on D&D Beyond?" };
  }

  const edition = editionOverride ?? (await detectEdition(data));
  const ruleset = await getRulesetAsync(edition);

  const raceName = raceDisplayName(data);
  const race = findByName(ruleset.races, raceName);
  if (!race) {
    return {
      error:
        `Could not find race "${raceName ?? "(unknown)"}" in this app's ${edition} compendium. ` +
        "This importer only knows the races/classes/backgrounds already built into the character sheet app - homebrew or non-SRD content isn't supported yet.",
    };
  }

  const backgroundName = data.background?.definition?.name;
  const background = findByName(ruleset.backgrounds, backgroundName);
  if (!background) {
    return { error: `Could not find background "${backgroundName ?? "(unknown)"}" in this app's ${edition} compendium.` };
  }

  const classEntries: { ddb: DdbClassEntry; built: CharacterClassLevel }[] = [];
  for (const entry of data.classes) {
    const className = entry.definition?.name;
    const characterClass = findByName(ruleset.classes, className);
    if (!characterClass) {
      return { error: `Could not find class "${className ?? "(unknown)"}" in this app's ${edition} compendium.` };
    }

    let subclass;
    const subclassName = entry.subclassDefinition?.name;
    if (subclassName) {
      subclass = findByName(
        ruleset.subclasses.filter((candidate) => candidate.parentClass === characterClass.name),
        subclassName,
      );
      if (!subclass) {
        warnings.push(`Subclass "${subclassName}" (${className}) wasn't found - you'll need to pick it again on the sheet.`);
      }
    }

    classEntries.push({
      ddb: entry,
      built: { class: characterClass, subclass, level: entry.level, hpMethod: "average" },
    });
  }

  // This app's convention (see interfaces/Characters.ts's CharacterClassLevel
  // header comment) is that classes[0] is always the "main" class -
  // proficiencies/saves/first hit die come from it. D&D Beyond instead marks
  // the main class with isStartingClass, in whatever array order it likes -
  // this stable sort just moves that entry to the front.
  classEntries.sort((a, b) => Number(!!b.ddb.isStartingClass) - Number(!!a.ddb.isStartingClass));
  const classes = classEntries.map((entry) => entry.built);

  const modifiersReadable = hasReadableModifiers(data.modifiers);
  const abilityBonuses = readAbilityScoreBonuses(data.modifiers);
  const finalAbilityScores = abilityScores(data, abilityBonuses);
  const skillProficiencies = readSkillProficiencies(data.modifiers);
  if (!modifiersReadable) {
    warnings.push(
      "Couldn't read D&D Beyond's ability-score/skill/language grants for this character - ability scores below are just the base stats plus any manual bonus D&D Beyond had recorded (no race/background/feat increases applied), and skill proficiencies are empty. Please compare against the D&D Beyond sheet and fill in what's missing.",
    );
  }

  const savingThrowProficiencies = classes[0].class.proficiencies.savingThrows;

  const inventory = data.inventory ?? [];
  const equipped = inventory.filter((item) => item.equipped);

  const weapons: Weapon[] = [];
  for (const item of equipped.filter((item) => item.definition.filterType === "Weapon")) {
    const weapon = mapWeapon(item, ruleset, warnings);
    if (weapon) weapons.push(weapon);
  }

  const armorPieces: Armor[] = [];
  for (const item of equipped.filter((item) => item.definition.filterType === "Armor")) {
    const armor = mapArmor(item, ruleset, warnings);
    if (armor) armorPieces.push(armor);
  }
  const shield = armorPieces.find((armor) => armor.category === "shield");
  const nonShieldArmor = armorPieces.filter((armor) => armor.category !== "shield");
  if (nonShieldArmor.length > 1) {
    warnings.push(
      `${nonShieldArmor.length} equipped armor pieces found - only "${nonShieldArmor[0].name}" was kept as the equipped armor, the rest were skipped.`,
    );
  }
  const equippedArmor = nonShieldArmor[0];

  const magicItems = equipped
    .filter((item) => item.definition.magic && !["Weapon", "Armor"].includes(item.definition.filterType ?? ""))
    .map((item) => mapMagicItem(item, ruleset));

  const currency: Currency = {
    copper: data.currencies?.cp ?? 0,
    silver: data.currencies?.sp ?? 0,
    electrum: data.currencies?.ep ?? 0,
    gold: data.currencies?.gp ?? 0,
    platinum: data.currencies?.pp ?? 0,
  };

  const maxHP = data.overrideHitPoints ?? (data.baseHitPoints ?? 0) + (data.bonusHitPoints ?? 0);
  const currentHP = Math.max(0, maxHP - (data.removedHitPoints ?? 0));
  const initiative = Math.floor((finalAbilityScores.dexterity - 10) / 2);

  const alignment = (data.alignmentId != null && ALIGNMENT_NAMES[data.alignmentId]) || "Unaligned";

  const feats = [];
  const originFeatName = background.originFeat;
  if (originFeatName) {
    const originFeat = findByName(ruleset.feats, originFeatName);
    if (originFeat) {
      feats.push(originFeat);
    } else {
      warnings.push(`Background origin feat "${originFeatName}" wasn't found in this app's ${edition} compendium - add it by hand.`);
    }
  }

  const isCaster = classes.some((entry) => entry.class.casterProgression !== "none" || !!entry.class.spellcasting);
  if (isCaster) {
    warnings.push(
      "This character has at least one spellcasting class - known/prepared spells couldn't be reliably read from D&D Beyond, so the spell list came in empty. Add spells on the sheet.",
    );
  }

  const details = buildDetails(data);

  const now = new Date().toISOString();
  const character: StoredCharacter = {
    id: generateId(),
    createdAt: now,
    updatedAt: now,
    edition,
    name: data.name,
    classes,
    race,
    background,
    feats,
    alignment,
    abilityScores: finalAbilityScores,
    skillProficiencies,
    savingThrowProficiencies,
    equippedArmor,
    shield,
    weapons,
    currency,
    initiative,
    currentHP,
    maxHP,
    spellsKnown: [],
    languages: [],
    magicItems: magicItems.length > 0 ? magicItems : undefined,
    details,
  };

  return { character, warnings, edition };
}

export { isConvertError };
