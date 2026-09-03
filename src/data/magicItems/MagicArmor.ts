import { Armor } from "@/interfaces/Armor";
import { GENERATED_MAGIC_ARMOR } from "./generated/GeneratedMagicArmor";

/**
 * Magic armor and shields - named items (e.g. "Armor of Invulnerability",
 * "Animated Shield") plus every base-armor expansion of a template like
 * "+1 Armor" or "Mithral Armor", auto-generated from data/Items.csv by
 * scripts/convert_items.py. Every entry is a plain `Armor` (matching what
 * utils/customMagicItems.ts's `enchantArmor` produces by hand) - see that
 * file's header comment for how a magic armor/shield fits into
 * `Character.equippedArmor`/`shield`.
 *
 * Not merged into `Ruleset.armor` itself (the mundane list) - exposed
 * separately as `Ruleset.magicArmor`. The character wizard's equipment step
 * (SkillsEquipmentStep) appends this list after the mundane one when
 * rendering its armor/shield pickers, rather than the two being combined
 * here. See src/data/index.ts.
 */
export const MAGIC_ARMOR: Armor[] = GENERATED_MAGIC_ARMOR;
