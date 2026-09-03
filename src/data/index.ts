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

import { WEAPONS } from "./weapons/Weapons";
import { ARMOR } from "./armor/Armor";

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
   * from `weapons` (which stays the mundane starting-equipment table).
   * SkillsEquipmentStep appends this after `weapons` when rendering its
   * weapon picker rather than the two being combined here. See
   * data/magicItems/MagicWeapons.ts.
   */
  magicWeapons: Weapon[];
  /**
   * Named magic armor and shields (e.g. "Animated Shield") - a separate
   * list from `armor` for the same reason as `magicWeapons` above. See
   * data/magicItems/MagicArmor.ts.
   */
  magicArmor: Armor[];
}

// Weapon and armor stats (the mundane starting-equipment tables) don't
// differ by edition and are tiny (a couple dozen entries each), so they
// stay eagerly imported and shared by both rulesets below. Everything else
// - races/classes/subclasses/backgrounds/feats per edition, the shared
// spell list, and especially the ~2.7MB of generated magic item/weapon/
// armor data - is multiple MB of source that used to be bundled into every
// page that ever imports from "@/data", even before the player picked an
// edition. That's what made the character wizard slow to load. Those are
// now loaded on demand via `buildRuleset` below: dynamic `import()`s of
// the barrel files in ./2014, ./2024, and ./magicItems, which webpack
// splits into their own chunks fetched only when actually needed, and
// cached afterwards (`rulesetCache`) so switching steps or coming back to
// the same edition later never re-fetches or re-parses them.

const rulesetCache = new Map<Edition, Promise<Ruleset>>();

async function buildRuleset(edition: Edition): Promise<Ruleset> {
  const [editionData, magicData, { SPELLS }] = await Promise.all([
    edition === "2014" ? import("./2014") : import("./2024"),
    import("./magicItems"),
    import("./spells/Spells"),
  ]);

  return {
    edition,
    races: editionData.RACES,
    classes: editionData.CLASSES,
    backgrounds: editionData.BACKGROUNDS,
    feats: editionData.FEATS,
    subclasses: editionData.SUBCLASSES,
    weapons: WEAPONS,
    armor: ARMOR,
    spells: SPELLS,
    magicItems: magicData.MAGIC_ITEMS,
    magicWeapons: magicData.MAGIC_WEAPONS,
    magicArmor: magicData.MAGIC_ARMOR,
  };
}

/**
 * Everything a character builder needs to populate its pickers for one
 * edition. This is the single entry point for "which races/classes/
 * backgrounds/feats/subclasses/spells/magic items exist under this
 * ruleset" - add new content by adding a file under data/2014, data/2024,
 * or data/magicItems and listing it in that directory's barrel (index.ts),
 * not by branching on edition elsewhere in the app.
 *
 * Async and cached per edition (one in-flight/resolved Promise each) - the
 * first call for an edition fetches and assembles it, every later call
 * (same edition, anywhere in the app) reuses that same Promise/result
 * instantly. Callers (see ManualWizard) hold the resolved Ruleset in state
 * rather than calling this on every render.
 */
export function getRulesetAsync(edition: Edition): Promise<Ruleset> {
  let cached = rulesetCache.get(edition);
  if (!cached) {
    cached = buildRuleset(edition);
    rulesetCache.set(edition, cached);
  }
  return cached;
}

/**
 * Looks up one named entry (by `type`, one of Ruleset's array-valued keys)
 * under `edition` - e.g. `await getSpecificItem("2024", "spells",
 * "Fireball")`. Async (awaits `getRulesetAsync` internally) for the same
 * reason that is - callers (the nav search bar's result page) already need
 * to handle a loading state around this rather than getting a value back
 * synchronously.
 */
export async function getSpecificItem(edition: Edition, type: keyof Ruleset, item: string) {
  const ruleset = await getRulesetAsync(edition);
  const group = ruleset[type] as unknown as { name: string }[];
  return group.find((i) => i.name === item);
}
