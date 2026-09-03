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
 * Not merged into `Ruleset.weapons` itself (the mundane mastery-table list)
 * - exposed separately as `Ruleset.magicWeapons`, since starting equipment
 * and found/purchased magic gear are different concerns. The character
 * wizard's equipment step (SkillsEquipmentStep) appends this list after the
 * mundane one when rendering its weapon picker, rather than the two being
 * combined here. See src/data/index.ts.
 */
export const MAGIC_WEAPONS: Weapon[] = GENERATED_MAGIC_WEAPONS;
