import { AbilityScores } from "@/interfaces/Characters";
import { CharacterDraft, AbilityScoreMethod, AbilityScoreState, DraftClassEntry } from "@/interfaces/CharacterDraft";
import { CharacterDetails } from "@/interfaces/CharacterDetails";
import { StoredCharacter } from "@/interfaces/StoredCharacter";
import { Edition } from "@/interfaces/Edition";
import { calculateAbilityModifiers } from "@/utils/abilityModifiers";
import { calculateMaxHP } from "@/utils/calculateMaxHp";
import { generateId } from "@/utils/id";
import { pointBuyStartingScores } from "@/utils/pointBuy";
import { rollAbilityScoreSet } from "@/utils/dice";
import { isValidBackgroundAllocation, subtractAbilityScores, sumAbilityScores } from "@/utils/abilityScoreBonuses";
import { classCanUseArmor, classCanUseWeapon } from "@/utils/proficiencyMatch";
import { getSpellLimits, pruneSpellsToLimits } from "@/utils/spellcasting";

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
        classes: [{ level: 1 }],
        abilityScores: abilityScoreStateForMethod("standard-array"),
        backgroundAbilityBonuses: {},
        skillProficiencies: [],
        weapons: [],
        currency: { copper: 0, silver: 0, electrum: 0, gold: 0, platinum: 0 },
        name: "",
        alignment: "",
        languages: [],
        spellsKnown: [],
        details: {},
    };
}

/**
 * Strips a details object down to `undefined` when nothing meaningful was
 * entered (every string empty, every nested object empty, inspiration/death
 * saves untouched) - so `finalizeDraft` never persists a `details: {}`
 * husk onto a character that never used the Details step's flavor fields.
 */
function cleanDetails(details: CharacterDetails): CharacterDetails | undefined {
    const cleaned: CharacterDetails = { ...details };

    if (cleaned.appearance && Object.values(cleaned.appearance).every((value) => !value)) {
        delete cleaned.appearance;
    }
    if (cleaned.flavor && Object.values(cleaned.flavor).every((value) => !value)) {
        delete cleaned.flavor;
    }

    const hasContent = Object.values(cleaned).some((value) => {
        if (value === undefined || value === "") return false;
        if (typeof value === "object") return Object.keys(value).length > 0;
        return true;
    });

    return hasContent ? cleaned : undefined;
}

/**
 * Loads an existing character back into a draft for editing. Every class
 * the character has levels in becomes its own `classes` entry - the
 * subclass is only ever carried over on `classes[0]` (the main class),
 * matching `DraftClassEntry`'s rule and the real "one subclass, on the
 * class you took it in" rule simplified to "always the main class".
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
    const backgroundAbilityBonuses = character.backgroundAbilityBonuses ?? {};
    const baseAbilityScores = subtractAbilityScores(
        character.abilityScores,
        character.race.abilityModifiers,
        backgroundAbilityBonuses
    );

    const classes: DraftClassEntry[] = character.classes.map(({ class: characterClass, subclass, level }, index) => ({
        characterClass,
        subclass: index === 0 ? subclass : undefined,
        level,
    }));

    return {
        id: character.id,
        edition: character.edition,
        race: character.race,
        classes,
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
        spellsKnown: character.spellsKnown,
        details: character.details ?? {},
    };
}

/** Every field `finalizeDraft` treats as mandatory. Each wizard step gates its own "Next" button on the piece it owns; this is the final, whole-draft check the Review step runs before allowing Save. */
export function isDraftReadyToFinalize(draft: CharacterDraft): boolean {
    return Boolean(
        draft.edition &&
            draft.race &&
            draft.classes.length > 0 &&
            draft.classes.every((entry) => entry.characterClass) &&
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
 *
 * `classes[0]` (the main class) supplies saving throw proficiencies and
 * (via calculateMaxHP) the first hit die - see DraftClassEntry's header
 * comment for why the wizard only ever offers a subclass on that entry.
 */
export function finalizeDraft(draft: CharacterDraft): StoredCharacter | null {
    const primary = draft.classes[0]?.characterClass;
    if (!isDraftReadyToFinalize(draft) || !draft.edition || !draft.race || !primary || !draft.background) {
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
        classes: draft.classes.map((entry) => ({
            class: entry.characterClass!,
            subclass: entry.subclass,
            level: entry.level,
        })),
        race: draft.race,
        background: draft.background,
        feats: [],
        alignment: draft.alignment,
        abilityScores,
        backgroundAbilityBonuses:
            Object.keys(draft.backgroundAbilityBonuses).length > 0 ? draft.backgroundAbilityBonuses : undefined,
        skillProficiencies: [...draft.background.skillProficiencies, ...draft.skillProficiencies],
        savingThrowProficiencies: primary.proficiencies.savingThrows,
        equippedArmor: draft.equippedArmor,
        shield: draft.shield,
        weapons: draft.weapons,
        currency: draft.currency,
        initiative: 0,
        currentHP: 0,
        maxHP: 0,
        // Was previously hardcoded to [] here regardless of what the Spells
        // step collected - the wizard step existed to fill in
        // `draft.spellsKnown`, but nothing ever read it back out.
        spellsKnown: draft.spellsKnown,
        languages: [...draft.race.languages, ...draft.languages],
        details: cleanDetails(draft.details),
    };

    base.initiative = calculateAbilityModifiers(base.abilityScores).dexterity;
    base.maxHP = calculateMaxHP(base);
    base.currentHP = base.maxHP;

    return base;
}

/**
 * Re-checks everything that depends on `draft.classes` and drops whatever
 * the current class/subclass/level selection no longer allows - called
 * whenever that selection changes (see ManualWizard's revalidation effect),
 * so a player can't carry forward a skill, armor, weapon, or spell picked
 * under a since-abandoned class choice.
 *
 * Skill and equipment proficiency are checked against `classes[0]` (the
 * main class) only - the wizard doesn't offer secondary classes' own
 * (RAW-reduced) multiclass proficiency choices, so there's nothing
 * class-specific from them to validate here. Spell limits, on the other
 * hand, are genuinely combined across every entry - see
 * utils/spellcasting.ts's `getSpellLimits`.
 */
export function revalidateDraftForClasses(draft: CharacterDraft): CharacterDraft {
    const primary = draft.classes[0]?.characterClass;

    const skillPool = primary ? primary.proficiencies.skills.from : [];
    const skillProficiencies = draft.skillProficiencies.filter((skill) => skillPool.includes(skill));

    const equippedArmor =
        primary && draft.equippedArmor && classCanUseArmor(primary, draft.equippedArmor) ? draft.equippedArmor : undefined;
    const shield = primary && draft.shield && classCanUseArmor(primary, draft.shield) ? draft.shield : undefined;
    const weapons = primary ? draft.weapons.filter((weapon) => classCanUseWeapon(primary, weapon)) : [];

    const abilityScores = sumAbilityScores(
        draft.abilityScores.scores,
        draft.race?.abilityModifiers ?? {},
        draft.backgroundAbilityBonuses
    );
    const limits = getSpellLimits(draft.classes, abilityScores);
    const spellsKnown = pruneSpellsToLimits(draft.spellsKnown, limits);

    return { ...draft, skillProficiencies, equippedArmor, shield, weapons, spellsKnown };
}
