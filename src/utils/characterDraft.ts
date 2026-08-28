import { AbilityScores } from "@/interfaces/Characters";
import { CharacterDraft, AbilityScoreMethod, AbilityScoreState } from "@/interfaces/CharacterDraft";
import { StoredCharacter } from "@/interfaces/StoredCharacter";
import { Edition } from "@/interfaces/Edition";
import { calculateAbilityModifiers } from "@/utils/abilityModifiers";
import { calculateMaxHP } from "@/utils/calculateMaxHp";
import { generateId } from "@/utils/id";
import { pointBuyStartingScores } from "@/utils/pointBuy";
import { rollAbilityScoreSet } from "@/utils/dice";
import { isValidBackgroundAllocation, subtractAbilityScores, sumAbilityScores } from "@/utils/abilityScoreBonuses";

const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];

const FLAT_TENS: AbilityScores = {
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
};

const ZERO_SCORES: AbilityScores = {
    strength: 0,
    dexterity: 0,
    constitution: 0,
    intelligence: 0,
    wisdom: 0,
    charisma: 0,
};

/**
 * Resets ability-score state for a freshly-selected method. Switching
 * methods always starts that method over from scratch rather than trying
 * to carry scores across - e.g. going from Point Buy to Roll shouldn't try
 * to reinterpret a point-buy 13 as a rolled value.
 */
export function abilityScoreStateForMethod(method: AbilityScoreMethod): AbilityScoreState {
    switch (method) {
        case "standard-array":
            return { method, scores: { ...ZERO_SCORES }, unassignedPool: [...STANDARD_ARRAY] };
        case "roll":
            return { method, scores: { ...ZERO_SCORES }, unassignedPool: rollAbilityScoreSet() };
        case "point-buy":
            return { method, scores: pointBuyStartingScores(), unassignedPool: [] };
        case "manual":
            return { method, scores: { ...FLAT_TENS }, unassignedPool: [] };
    }
}

export function createEmptyDraft(edition?: Edition): CharacterDraft {
    return {
        edition,
        classLevel: 1,
        abilityScores: abilityScoreStateForMethod("standard-array"),
        backgroundAbilityBonuses: {},
        skillProficiencies: [],
        weapons: [],
        currency: { copper: 0, silver: 0, electrum: 0, gold: 0, platinum: 0 },
        name: "",
        alignment: "",
        languages: [],
    };
}

/**
 * Loads an existing character back into a draft for editing.
 *
 * Known limitation: the wizard only edits a SINGLE class/level - a
 * multiclassed character loaded here only shows/lets you edit
 * `classes[0]`. Editing multiclass characters end-to-end would need the
 * class/ability/skill steps to become per-class-entry, which is a bigger
 * change than this generator makes right now; flagging it here rather than
 * silently dropping the other classes on save. (In practice `finalizeDraft`
 * below only ever writes back a single-entry `classes` array, so editing
 * and re-saving a multiclass character DOES currently drop its other
 * classes - avoid editing multiclass characters through this flow until
 * that's addressed.)
 *
 * The Ability Scores step edits BASE scores, not final ones - `character
 * .abilityScores` is always final (race + background bonuses already
 * added in, see utils/abilityScoreBonuses.ts), so this subtracts the
 * race's modifiers and the character's stored `backgroundAbilityBonuses`
 * back out. A character saved before that field existed has no bonus on
 * record (`?? {}` below), so its base scores here will still include
 * whatever background bonus it should have gotten but originally didn't -
 * `isDraftReadyToFinalize` will require the bonus to be (re-)allocated
 * before it can be saved again, which is the correct way to backfill it.
 */
export function draftFromCharacter(character: StoredCharacter): CharacterDraft {
    const primaryClass = character.classes[0];
    const backgroundAbilityBonuses = character.backgroundAbilityBonuses ?? {};
    const baseAbilityScores = subtractAbilityScores(
        character.abilityScores,
        character.race.abilityModifiers,
        backgroundAbilityBonuses
    );

    return {
        id: character.id,
        edition: character.edition,
        race: character.race,
        characterClass: primaryClass?.class,
        subclass: primaryClass?.subclass,
        classLevel: primaryClass?.level ?? 1,
        abilityScores: { method: "manual", scores: baseAbilityScores, unassignedPool: [] },
        background: character.background,
        backgroundAbilityBonuses,
        skillProficiencies: character.skillProficiencies.filter(
            (skill) => !character.background.skillProficiencies.includes(skill)
        ),
        equippedArmor: character.equippedArmor,
        shield: character.shield,
        weapons: character.weapons,
        currency: character.currency,
        name: character.name,
        alignment: character.alignment,
        languages: character.languages.filter((language) => !character.race.languages.includes(language)),
    };
}

/** Every field `finalizeDraft` treats as mandatory. Each wizard step gates its own "Next" button on the piece it owns; this is the final, whole-draft check the Review step runs before allowing Save. */
export function isDraftReadyToFinalize(draft: CharacterDraft): boolean {
    return Boolean(
        draft.edition &&
            draft.race &&
            draft.characterClass &&
            draft.background &&
            draft.name.trim().length > 0 &&
            draft.alignment &&
            draft.abilityScores.unassignedPool.length === 0 &&
            isValidBackgroundAllocation(draft.background, draft.backgroundAbilityBonuses)
    );
}

/**
 * Turns a completed draft into a `StoredCharacter`, computing the derived
 * fields (initiative, max/current HP) the same way the rest of the app
 * does (utils/abilityModifiers.ts, utils/calculateMaxHp.ts) so a generated
 * character's numbers match what those utilities would compute for it
 * later. Returns `null` if the draft isn't ready - callers should check
 * `isDraftReadyToFinalize` first and treat `null` as "don't call this yet"
 * rather than a normal outcome to design around.
 *
 * `abilityScores` on the result is the FINAL score: the base scores from
 * the Ability Scores step, plus the race's flat modifiers (2014), plus the
 * background's chosen allocation (2024) - see utils/abilityScoreBonuses.ts.
 * Neither bonus was being applied at all before this - `draft.abilityScores
 * .scores` was written straight through as the character's final score.
 */
export function finalizeDraft(draft: CharacterDraft): StoredCharacter | null {
    if (!isDraftReadyToFinalize(draft) || !draft.edition || !draft.race || !draft.characterClass || !draft.background) {
        return null;
    }

    const now = new Date().toISOString();
    const abilityScores = sumAbilityScores(
        draft.abilityScores.scores,
        draft.race.abilityModifiers,
        draft.backgroundAbilityBonuses
    );

    const base: StoredCharacter = {
        id: draft.id ?? generateId(),
        // `saveCharacter` (utils/storage.ts) pins the real `createdAt` when this is an
        // update - it looks up the existing record by id rather than trusting this
        // value, since a draft doesn't carry its original creation time.
        createdAt: now,
        updatedAt: now,
        edition: draft.edition,
        name: draft.name.trim(),
        classes: [{ class: draft.characterClass, subclass: draft.subclass, level: draft.classLevel }],
        race: draft.race,
        background: draft.background,
        feats: [],
        alignment: draft.alignment,
        abilityScores,
        backgroundAbilityBonuses:
            Object.keys(draft.backgroundAbilityBonuses).length > 0 ? draft.backgroundAbilityBonuses : undefined,
        skillProficiencies: [...draft.background.skillProficiencies, ...draft.skillProficiencies],
        savingThrowProficiencies: draft.characterClass.proficiencies.savingThrows,
        equippedArmor: draft.equippedArmor,
        shield: draft.shield,
        weapons: draft.weapons,
        currency: draft.currency,
        initiative: 0,
        currentHP: 0,
        maxHP: 0,
        spellsKnown: [],
        languages: [...draft.race.languages, ...draft.languages],
    };

    base.initiative = calculateAbilityModifiers(base.abilityScores).dexterity;
    base.maxHP = calculateMaxHP(base);
    base.currentHP = base.maxHP;

    return base;
}
