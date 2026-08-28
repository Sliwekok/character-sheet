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
    characterClass?: CharacterClass;
    subclass?: Subclass;
    /** Level within `characterClass`. Multiclassing isn't supported by the wizard yet - see draftFromCharacter()'s header comment. */
    classLevel: number;
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
    currency: Currency;
    name: string;
    alignment: string;
    /** Extra languages beyond the ones `race` grants automatically. */
    languages: string[];
}
