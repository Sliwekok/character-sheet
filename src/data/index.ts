import { Edition } from "@/interfaces/Edition";
import { Race } from "@/interfaces/Race";
import { CharacterClass } from "@/interfaces/CharacterClass";
import { Background } from "@/interfaces/Background";
import { Feat } from "@/interfaces/Feat";
import { Subclass } from "@/interfaces/Subclass";
import { Weapon } from "@/interfaces/Weapon";
import { Spell } from "@/interfaces/Spell";
import { Armor } from "@/interfaces/Armor";
import { MagicItem } from "@/interfaces/MagicItem";

import { RACES_2014 } from "./2014/races/Races";
import { BACKGROUNDS_2014 } from "./2014/backgrounds/Backgrounds";
import { FEATS_2014 } from "./2014/feats/Feats";

import { Artificer as Artificer2014 } from "./2014/classes/Artificer";
import { Barbarian as Barbarian2014 } from "./2014/classes/Barbarian";
import { Bard as Bard2014 } from "./2014/classes/Bard";
import { Cleric as Cleric2014 } from "./2014/classes/Cleric";
import { Druid as Druid2014 } from "./2014/classes/Druid";
import { Fighter as Fighter2014 } from "./2014/classes/Fighter";
import { Monk as Monk2014 } from "./2014/classes/Monk";
import { Paladin as Paladin2014 } from "./2014/classes/Paladin";
import { Ranger as Ranger2014 } from "./2014/classes/Ranger";
import { Rogue as Rogue2014 } from "./2014/classes/Rogue";
import { Sorcerer as Sorcerer2014 } from "./2014/classes/Sorcerer";
import { Warlock as Warlock2014 } from "./2014/classes/Warlock";
import { Wizard as Wizard2014 } from "./2014/classes/Wizard";

import { ArtificerSubclasses as ArtificerSubclasses2014 } from "./2014/subclasses/Artificer";
import { BarbarianSubclasses as BarbarianSubclasses2014 } from "./2014/subclasses/Barbarian";
import { BardSubclasses as BardSubclasses2014 } from "./2014/subclasses/Bard";
import { ClericSubclasses as ClericSubclasses2014 } from "./2014/subclasses/Cleric";
import { DruidSubclasses as DruidSubclasses2014 } from "./2014/subclasses/Druid";
import { FighterSubclasses as FighterSubclasses2014 } from "./2014/subclasses/Fighter";
import { MonkSubclasses as MonkSubclasses2014 } from "./2014/subclasses/Monk";
import { PaladinSubclasses as PaladinSubclasses2014 } from "./2014/subclasses/Paladin";
import { RangerSubclasses as RangerSubclasses2014 } from "./2014/subclasses/Ranger";
import { RogueSubclasses as RogueSubclasses2014 } from "./2014/subclasses/Rogue";
import { SorcererSubclasses as SorcererSubclasses2014 } from "./2014/subclasses/Sorcerer";
import { WarlockSubclasses as WarlockSubclasses2014 } from "./2014/subclasses/Warlock";
import { WizardSubclasses as WizardSubclasses2014 } from "./2014/subclasses/Wizard";

import { RACES_2024 } from "./2024/races/Races";
import { BACKGROUNDS_2024 } from "./2024/backgrounds/Backgrounds";
import { FEATS_2024 } from "./2024/feats/Feats";

import { Artificer as Artificer2024 } from "./2024/classes/Artificer";
import { Barbarian as Barbarian2024 } from "./2024/classes/Barbarian";
import { Bard as Bard2024 } from "./2024/classes/Bard";
import { Cleric as Cleric2024 } from "./2024/classes/Cleric";
import { Druid as Druid2024 } from "./2024/classes/Druid";
import { Fighter as Fighter2024 } from "./2024/classes/Fighter";
import { Monk as Monk2024 } from "./2024/classes/Monk";
import { Paladin as Paladin2024 } from "./2024/classes/Paladin";
import { Ranger as Ranger2024 } from "./2024/classes/Ranger";
import { Rogue as Rogue2024 } from "./2024/classes/Rogue";
import { Sorcerer as Sorcerer2024 } from "./2024/classes/Sorcerer";
import { Warlock as Warlock2024 } from "./2024/classes/Warlock";
import { Wizard as Wizard2024 } from "./2024/classes/Wizard";

import { ArtificerSubclasses as ArtificerSubclasses2024 } from "./2024/subclasses/Artificer";
import { BarbarianSubclasses as BarbarianSubclasses2024 } from "./2024/subclasses/Barbarian";
import { BardSubclasses as BardSubclasses2024 } from "./2024/subclasses/Bard";
import { ClericSubclasses as ClericSubclasses2024 } from "./2024/subclasses/Cleric";
import { DruidSubclasses as DruidSubclasses2024 } from "./2024/subclasses/Druid";
import { FighterSubclasses as FighterSubclasses2024 } from "./2024/subclasses/Fighter";
import { MonkSubclasses as MonkSubclasses2024 } from "./2024/subclasses/Monk";
import { PaladinSubclasses as PaladinSubclasses2024 } from "./2024/subclasses/Paladin";
import { RangerSubclasses as RangerSubclasses2024 } from "./2024/subclasses/Ranger";
import { RogueSubclasses as RogueSubclasses2024 } from "./2024/subclasses/Rogue";
import { SorcererSubclasses as SorcererSubclasses2024 } from "./2024/subclasses/Sorcerer";
import { WarlockSubclasses as WarlockSubclasses2024 } from "./2024/subclasses/Warlock";
import { WizardSubclasses as WizardSubclasses2024 } from "./2024/subclasses/Wizard";

import { WEAPONS } from "./weapons/Weapons";
import { ARMOR } from "./armor/Armor";
import { MAGIC_ITEMS } from "./magicItems/MagicItems";
import { MAGIC_WEAPONS } from "./magicItems/MagicWeapons";
import { MAGIC_ARMOR } from "./magicItems/MagicArmor";
import { SPELLS } from "./spells/Spells";

export interface Ruleset {
  edition: Edition;
  races: Race[];
  classes: CharacterClass[];
  backgrounds: Background[];
  feats: Feat[];
  subclasses: Subclass[];
  /** Weapon stats are edition-agnostic, so both rulesets expose the same list. */
  weapons: Weapon[];
  /** Armor stats are edition-agnostic too - same list shared by both rulesets. */
  armor: Armor[];
  /** Spells are edition-agnostic too (see interfaces/Spell.ts) - same list shared by both rulesets. */
  spells: Spell[];
  /** Non-armor/weapon magic items (wondrous items, rings, rods, staves, wands, potions, scrolls) - edition-agnostic, same list shared by both rulesets. */
  magicItems: MagicItem[];
  /**
   * Named magic weapons (e.g. "Flame Tongue Longsword") - a separate list
   * from `weapons` (which stays the mundane starting-equipment table), for
   * a future "browse loot"/enchant-picker UI. See data/magicItems/MagicWeapons.ts.
   */
  magicWeapons: Weapon[];
  /**
   * Named magic armor and shields (e.g. "Animated Shield") - a separate
   * list from `armor` for the same reason as `magicWeapons` above. See
   * data/magicItems/MagicArmor.ts.
   */
  magicArmor: Armor[];
}

// Weapon, armor, and magic item data don't differ by edition, so all three
// are shared here rather than duplicated per edition (weapon mastery
// usability is governed by CharacterClass.weaponMasteryProgression
// instead, not by the weapon itself).

const RULESETS: Record<Edition, Ruleset> = {
  "2014": {
    edition: "2014",
    // Human2014 stays hand-authored rather than generated - see the header
    // comment in 2014/races/Races.ts for why (5etools' own data is missing
    // an `ability` field for PHB Human entirely).
    races: RACES_2014,
    classes: [
      Artificer2014, Barbarian2014, Bard2014, Cleric2014, Druid2014, Fighter2014,
      Monk2014, Paladin2014, Ranger2014, Rogue2014, Sorcerer2014, Warlock2014, Wizard2014,
    ],
    backgrounds: BACKGROUNDS_2014,
    feats: FEATS_2014,
    subclasses: [
      ...ArtificerSubclasses2014, ...BarbarianSubclasses2014, ...BardSubclasses2014,
      ...ClericSubclasses2014, ...DruidSubclasses2014, ...FighterSubclasses2014,
      ...MonkSubclasses2014, ...PaladinSubclasses2014, ...RangerSubclasses2014,
      ...RogueSubclasses2014, ...SorcererSubclasses2014, ...WarlockSubclasses2014,
      ...WizardSubclasses2014,
    ],
    weapons: WEAPONS,
    armor: ARMOR,
    spells: SPELLS,
    magicItems: MAGIC_ITEMS,
    magicWeapons: MAGIC_WEAPONS,
    magicArmor: MAGIC_ARMOR,
  },
  "2024": {
    edition: "2024",
    races: RACES_2024,
    // Artificer's 2024 printing is Eberron: Forge of the Artificer (EFA,
    // 2023) rather than an XPHB entry - see the Artificer2024 class file's
    // header comment.
    classes: [
      Artificer2024, Barbarian2024, Bard2024, Cleric2024, Druid2024, Fighter2024, Monk2024,
      Paladin2024, Ranger2024, Rogue2024, Sorcerer2024, Warlock2024, Wizard2024,
    ],
    backgrounds: BACKGROUNDS_2024,
    feats: FEATS_2024,
    subclasses: [
      ...ArtificerSubclasses2024, ...BarbarianSubclasses2024, ...BardSubclasses2024, ...ClericSubclasses2024,
      ...DruidSubclasses2024, ...FighterSubclasses2024, ...MonkSubclasses2024,
      ...PaladinSubclasses2024, ...RangerSubclasses2024, ...RogueSubclasses2024,
      ...SorcererSubclasses2024, ...WarlockSubclasses2024, ...WizardSubclasses2024,
    ],
    weapons: WEAPONS,
    armor: ARMOR,
    spells: SPELLS,
    magicItems: MAGIC_ITEMS,
    magicWeapons: MAGIC_WEAPONS,
    magicArmor: MAGIC_ARMOR,
  },
};

/**
 * Everything a character builder needs to populate its pickers for one
 * edition. This is the single entry point for "which races/classes/
 * backgrounds/feats/subclasses/spells exist under this ruleset" - add new
 * content by adding a file under data/2014 or data/2024 and listing it
 * here, not by branching on edition elsewhere in the app.
 */
export function getRuleset(edition: Edition): Ruleset {
  return RULESETS[edition];
}

export function getSpecificItem(edition: string, type: string, item: string) {
    const ruleset = getRuleset(edition as Edition);
    const gruop = ruleset[type as keyof Ruleset] as any[];

    return gruop.find((i) => i.name === item);
}
