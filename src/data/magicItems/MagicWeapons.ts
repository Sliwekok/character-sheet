import { Weapon } from "@/interfaces/Weapon";
import { GENERATED_MAGIC_WEAPONS } from "./generated/GeneratedMagicWeapons";

/**
 * Magic weapons - named items (e.g. "Flame Tongue Longsword", "Vorpal
 * Greatsword") auto-generated from data/Items.csv by
 * scripts/convert_items.py. Every entry is a plain `Weapon` (matching what
 * utils/customMagicItems.ts's `enchantWeapon` produces by hand) with
 * `bonus`/`rarity`/`requiresAttunement`/`magicDescription` set - see that
 * file's header comment for how a magic weapon fits into `Character.weapons`.
 *
 * Not merged into `Ruleset.weapons` (the mundane mastery-table list used by
 * the character-creation wizard's starting-equipment picker) - exposed
 * separately as `Ruleset.magicWeapons` instead, for a future "browse loot"
 * UI, since starting equipment and found/purchased magic gear are different
 * concerns. See src/data/index.ts.
 */
export const MAGIC_WEAPONS: Weapon[] = GENERATED_MAGIC_WEAPONS;
