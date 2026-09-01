import { AbilityScores } from "@/interfaces/Characters";
import { Edition } from "@/interfaces/Edition";
import { Race } from "@/interfaces/Race";
import { CharacterClass } from "@/interfaces/CharacterClass";
import { Subclass } from "@/interfaces/Subclass";
import { Background } from "@/interfaces/Background";
import { SkillName } from "@/interfaces/Skill";
import { Armor } from "@/interfaces/Armor";
import { Weapon } from "@/interfaces/Weapon";
import { Currency } from "@/interfaces/Currency";
import { Spell } from "@/interfaces/Spell";
import { CharacterDetails } from "@/interfaces/CharacterDetails";
import { MagicItem } from "@/interfaces/MagicItem";

export type AbilityScoreMethod = "standard-array" | "point-buy" | "roll" | "manual";

export interface AbilityScoreState {
    method: AbilityScoreMethod;
    scores: AbilityScores;
    /**
     * The pool of values still waiting to be assigned to an ability, one at
     * a time, by `AbilityScoresStep`. Populated for `"roll"` (six
     * 4d6-drop-lowest results) and `"standard-array"` (the fixed
     * 15/14/13/12/10/8 set) - both are "assign each of these six numbers to
     * a different ability exactly once" methods, just with different
     * sources for the numbers. Always empty for `"point-buy"` and
     * `"manual"`, which set `scores` directly instead.
     */
    unassignedPool: number[];
}

/**
 * One class-and-level entry being built in the wizard - mirrors
 * `CharacterClassLevel` (interfaces/Characters.ts) but every field is
 * optional/present-in-progress the same way the rest of `CharacterDraft`
 * is, since a row can exist before the player has picked a class for it
 * (see ClassStep's "Add class" button).
 *
 * `subclass` is only ever meaningful on `classes[0]` (the "main" class) -
 * ClassStep never offers a subclass picker for any later entry, so
 * multiclass entries always have `subclass: undefined`. This mirrors the
 * real rule that a character has exactly one subclass, always on the class
 * they took it in - simplified here to always be the main class, since the
 * wizard has no way to reach subclassLevel in anything but the class you
 * started in before this feature existed anyway.
 */
export interface DraftClassEntry {
    characterClass?: CharacterClass;
    subclass?: Subclass;
    level: number;
}

/**
 * Working state for a character that is being built or edited, one step at
 * a time. Every field is optional/defaulted so the draft is always a valid
 * object to render, even before the player has made a choice - each
 * wizard step is responsible for deciding whether ITS OWN required field
 * is filled in before letting the player continue (see each Step
 * component's `isComplete` check).
 *
 * `finalizeDraft()` (utils/characterDraft.ts) is the only place that turns
 * this into a real `Character`/`StoredCharacter` - nothing else should
 * read a `CharacterDraft` as though it were a finished character.
 */
export interface CharacterDraft {
    /** Present only when editing an existing character - see draftFromCharacter(). */
    id?: string;
    edition?: Edition;
    race?: Race;
    /**
     * One entry per class the character has levels in - always at least
     * one (createEmptyDraft seeds a single not-yet-chosen entry).
     * `classes[0]` is the "main" class: proficiencies, saving throws, and
     * the first hit die all come from it (see finalizeDraft/
     * calculateMaxHp), and it's the only entry with a subclass picker -
     * see DraftClassEntry.
     */
    classes: DraftClassEntry[];
    /** Base ability scores only - race/background bonuses are NOT baked in here, see `backgroundAbilityBonuses` below and utils/abilityScoreBonuses.ts's `sumAbilityScores()`. */
    abilityScores: AbilityScoreState;
    background?: Background;
    /**
     * The player's chosen allocation of `background.abilityScoreOptions`
     * (2024 only) - e.g. `{ wisdom: 2, charisma: 1 }` for a "2-1" background.
     * Always `{}` for a 2014 background (or before one is chosen) - see
     * utils/abilityScoreBonuses.ts's `isValidBackgroundAllocation()`, which
     * enforces exactly that.
     */
    backgroundAbilityBonuses: Partial<AbilityScores>;
    /** Skills chosen at the class-skill step. Skills granted automatically by `background` are NOT duplicated in here. */
    skillProficiencies: SkillName[];
    equippedArmor?: Armor;
    shield?: Armor;
    weapons: Weapon[];
    /**
     * Magic items carried/owned beyond the equipped armor/shield/weapons
     * above (those can be magic items in their own right - see the
     * magic-item fields on Armor/Weapon). Picked from the compendium or
     * homebrewed via `createCustomMagicItem` on the Magic Items step - see
     * utils/customMagicItems.ts. Always `[]` rather than undefined, same
     * convention as `weapons`; `finalizeDraft()` drops it back to
     * `undefined` on `Character.magicItems` when empty.
     */
    magicItems: MagicItem[];
    currency: Currency;
    name: string;
    alignment: string;
    /** Extra languages beyond the ones `race` grants automatically. */
    languages: string[];
    /**
     * Spells picked on the Spells step (only shown for spellcasting
     * classes - see SpellsStep and ManualWizard's `isSpellcaster`). Always
     * `[]` for a non-caster. Carried straight through to
     * `Character.spellsKnown` by `finalizeDraft()`.
     */
    spellsKnown: Spell[];
    /** Flavor/print-only fields, edited on the Details step - see CharacterDetails.ts. Always a valid (possibly empty) object, same convention as `backgroundAbilityBonuses` above. */
    details: CharacterDetails;
}
