import { AbilityScores } from "@/interfaces/Characters";
import { CharacterDraft, AbilityScoreMethod, AbilityScoreState, DraftClassEntry } from "@/interfaces/CharacterDraft";
import { CharacterDetails } from "@/interfaces/CharacterDetails";
import { StoredCharacter } from "@/interfaces/StoredCharacter";
import { Edition } from "@/interfaces/Edition";
import { calculateAbilityModifiers } from "@/utils/abilityModifiers";
import { buildHpHistory, HpClassInput } from "@/utils/calculateMaxHp";
import { generateId } from "@/utils/id";
import { pointBuyStartingScores } from "@/utils/pointBuy";
import { rollAbilityScoreSet } from "@/utils/dice";
import { isValidBackgroundAllocation, subtractAbilityScores, sumAbilityScores } from "@/utils/abilityScoreBonuses";
import { areAsiSlotsComplete, getAsiSlots, pruneAsiAllocations, sumAsiAllocations } from "@/utils/abilityScoreImprovements";
import { classCanUseArmor, classCanUseWeapon } from "@/utils/proficiencyMatch";
import { getSpellLimits, pruneSpellsToLimits } from "@/utils/spellcasting";
import { areFeatureChoicesComplete, pruneFeatureChoices } from "@/utils/grantedSpells";
import { getEquippedArmor, getEquippedShield, reconcileOwnedArmors } from "@/utils/armor";
import {
    areFeatSlotsComplete,
    asiSlotsNeedingAllocation,
    featClaimedSkills,
    featContextForDraft,
    featSelectionsFromCharacter,
    getFeatGrants,
    getFeatHpBonuses,
    getFeatInitiativeBonuses,
    reconcileFeatSelections,
    resolveFeatSelections,
    sumFeatAbilityBonuses,
} from "@/utils/feats";
import { calculateProficiencyBonus } from "@/utils/calculateProficiencyBonus";
import { getCharacterLevel } from "@/interfaces/Characters";

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
        classes: [{ level: 1, hpMethod: "average" }],
        abilityScores: abilityScoreStateForMethod("standard-array"),
        backgroundAbilityBonuses: {},
        abilityScoreImprovements: {},
        skillProficiencies: [],
        ownedArmors: [],
        weapons: [],
        featSelections: {},
        feats: [],
        magicItems: [],
        currency: { copper: 0, silver: 0, electrum: 0, gold: 0, platinum: 0 },
        name: "",
        alignment: "",
        languages: [],
        spellsKnown: [],
        grantedSpells: [],
        featureChoices: {},
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
 * Recovers the raw die rolls previously stored for one class entry (see
 * `DraftClassEntry.hpRolls`), in ascending level order - only the levels
 * that actually used `method: "roll"` contribute a value, so this comes
 * back empty for an "average"-method class (nothing to recover) or for a
 * character saved before per-level HP history existed at all.
 */
function hpRollsForClass(character: StoredCharacter, classIndex: number): number[] {
    return (character.hpHistory ?? [])
        .filter((entry) => entry.classIndex === classIndex && !entry.isFirstLevel && entry.method === "roll")
        .sort((a, b) => a.levelInClass - b.levelInClass)
        .map((entry) => entry.roll!)
        .filter((roll) => roll !== undefined);
}

/**
 * Loads an existing character back into a draft for editing. Every class
 * the character has levels in becomes its own `classes` entry, subclass
 * included - a character can have a subclass on any class they've reached
 * that class's own `subclassLevel` in, not just the main class (see
 * `DraftClassEntry`'s header comment and ClassStep's per-entry subclass
 * picker).
 *
 * The Ability Scores step edits BASE scores, not final ones - `character
 * .abilityScores` is always final (race + background bonus + ASI
 * allocations already added in, see utils/abilityScoreBonuses.ts and
 * utils/abilityScoreImprovements.ts), so this subtracts the race's
 * modifiers, the character's stored `backgroundAbilityBonuses`, and its
 * stored `abilityScoreImprovements` back out. A character saved before
 * those fields existed has no bonus on record (`?? {}` below), so its base
 * scores here will still include whatever bonus it should have gotten but
 * originally didn't - `isDraftReadyToFinalize` will require the bonus to be
 * (re-)allocated before it can be saved again, which is the correct way to
 * backfill it.
 *
 * Each entry's HP method/rolls are recovered too, from `character.hpHistory`
 * (see `hpRollsForClass`) - so re-opening a character for editing doesn't
 * silently reroll HP it already locked in for a "roll"-method class, the
 * same way its ability scores aren't silently re-rolled either.
 */
export function draftFromCharacter(character: StoredCharacter): CharacterDraft {
    const backgroundAbilityBonuses = character.backgroundAbilityBonuses ?? {};

    const classes: DraftClassEntry[] = character.classes.map(({ class: characterClass, subclass, level, hpMethod }, index) => ({
        characterClass,
        subclass,
        level,
        hpMethod: hpMethod ?? "average",
        hpRolls: hpRollsForClass(character, index),
    }));

    const abilityScoreImprovements = character.abilityScoreImprovements ?? {};
    const asiSlots = getAsiSlots(classes.map((entry) => ({ characterClass: entry.characterClass, level: entry.level })));
    const asiBonuses = sumAsiAllocations(asiSlots, abilityScoreImprovements);

    // Feat bonuses are subtracted from the SAVED selections' bookkeeping
    // (exactly what finalizeDraft added) - a character saved before feats
    // were selectable has no `featSelections`, so nothing is subtracted and
    // its old feats land in slots with their choices still open (see
    // featSelectionsFromCharacter), the same backfill route as a missing ASI.
    const featSelections = featSelectionsFromCharacter(character);
    const featBonuses = sumFeatAbilityBonuses(character.featSelections);
    const resolvedFeats = resolveFeatSelections(character.featSelections ?? [], character.feats ?? []);
    const featSkills = featClaimedSkills(resolvedFeats, character.skillExpertise ?? []);
    const featGrants = getFeatGrants(resolvedFeats, []);

    const baseAbilityScores = subtractAbilityScores(
        character.abilityScores,
        character.race.abilityModifiers,
        backgroundAbilityBonuses,
        asiBonuses,
        featBonuses
    );

    return {
        id: character.id,
        edition: character.edition,
        race: character.race,
        classes,
        abilityScores: { method: "manual", scores: baseAbilityScores, unassignedPool: [] },
        background: character.background,
        backgroundAbilityBonuses,
        abilityScoreImprovements,
        skillProficiencies: character.skillProficiencies.filter(
            (skill) => !character.background.skillProficiencies.includes(skill) && !featSkills.includes(skill)
        ),
        // The wizard step only ever lets the player edit one worn armor and
        // one worn shield at a time (see `equippedArmor`/`shield`'s header
        // comment on CharacterDraft) - `ownedArmors` carries the character's
        // FULL armor/shield list through untouched so `finalizeDraft` can
        // reconcile these two picks back into it without losing anything
        // else the Shop added (see utils/armor.ts's `reconcileOwnedArmors`).
        equippedArmor: getEquippedArmor(character),
        shield: getEquippedShield(character),
        ownedArmors: character.armors ?? [],
        weapons: character.weapons,
        featSelections,
        feats: character.feats ?? [],
        magicItems: character.magicItems ?? [],
        currency: character.currency,
        name: character.name,
        alignment: character.alignment,
        languages: character.languages.filter(
            (language) => !character.race.languages.includes(language) && !featGrants.languages.includes(language)
        ),
        spellsKnown: character.spellsKnown,
        // Seeded from the stored character so it's not empty for a beat
        // before ManualWizard's ruleset-driven effect gets a chance to
        // recompute it (and confirm it's still current) - see
        // `CharacterDraft.grantedSpells`'s header comment.
        grantedSpells: character.grantedSpells ?? [],
        // Same head-start-seed reasoning as `grantedSpells` above - ManualWizard's
        // effect re-derives `grantedSpells` from this (and prunes stale entries)
        // once the ruleset has loaded.
        featureChoices: character.featureChoices ?? {},
        details: character.details ?? {},
        // Editing must not quietly un-share (or re-share) a character.
        visibility: character.visibility,
        campaignId: character.campaignId,
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
            isValidBackgroundAllocation(draft.background, draft.backgroundAbilityBonuses) &&
            areAsiSlotsComplete(asiSlotsNeedingAllocation(getAsiSlots(draft.classes), draft.featSelections), draft.abilityScoreImprovements) &&
            areFeatureChoicesComplete(draft.classes, draft.featureChoices) &&
            areFeatSlotsComplete(draft, (slotKey) => featContextForDraft(draft, { feats: draft.feats }, slotKey))
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
 * background's chosen allocation (2024), plus every earned Ability Score
 * Improvement's chosen allocation - see utils/abilityScoreBonuses.ts and
 * utils/abilityScoreImprovements.ts.
 *
 * `classes[0]` (the main class) supplies saving throw proficiencies and
 * (via calculateMaxHP) the first hit die - see DraftClassEntry's header
 * comment. Subclass, unlike those, is carried straight through for every
 * entry, not just the main class.
 */
export function finalizeDraft(draft: CharacterDraft): StoredCharacter | null {
    const primary = draft.classes[0]?.characterClass;
    if (!isDraftReadyToFinalize(draft) || !draft.edition || !draft.race || !primary || !draft.background) {
        return null;
    }

    const now = new Date().toISOString();
    const asiSlots = getAsiSlots(draft.classes);
    // An ASI level taken as a feat contributes through its feat selection instead.
    const asiBonuses = sumAsiAllocations(asiSlotsNeedingAllocation(asiSlots, draft.featSelections), draft.abilityScoreImprovements);
    const featSelectionList = Object.values(draft.featSelections).filter((selection) => selection.featName);
    const featBonuses = sumFeatAbilityBonuses(featSelectionList);
    const abilityScores = sumAbilityScores(
        draft.abilityScores.scores,
        draft.race.abilityModifiers,
        draft.backgroundAbilityBonuses,
        asiBonuses,
        featBonuses
    );

    const resolvedFeats = resolveFeatSelections(featSelectionList, draft.feats);
    const baseSkills = [...draft.background.skillProficiencies, ...draft.skillProficiencies];
    const featGrants = getFeatGrants(resolvedFeats, baseSkills, draft.classes);
    const baseLanguages = [...draft.race.languages, ...draft.languages];
    const abilityScoreImprovements = Object.fromEntries(
        Object.entries(draft.abilityScoreImprovements).filter(([key]) => !draft.featSelections[`asi:${key}`])
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
            hpMethod: entry.hpMethod ?? "average",
        })),
        race: draft.race,
        background: draft.background,
        feats: resolvedFeats.map((entry) => entry.feat),
        featSelections: featSelectionList.length > 0 ? featSelectionList : undefined,
        skillExpertise: featGrants.expertise.length > 0 ? featGrants.expertise : undefined,
        alignment: draft.alignment,
        abilityScores,
        backgroundAbilityBonuses:
            Object.keys(draft.backgroundAbilityBonuses).length > 0 ? draft.backgroundAbilityBonuses : undefined,
        abilityScoreImprovements: Object.keys(abilityScoreImprovements).length > 0 ? abilityScoreImprovements : undefined,
        skillProficiencies: [...baseSkills, ...featGrants.skillProficiencies.filter((skill) => !baseSkills.includes(skill))],
        savingThrowProficiencies: [
            ...primary.proficiencies.savingThrows,
            ...featGrants.savingThrows.filter((save) => !primary.proficiencies.savingThrows.includes(save)),
        ],
        armors: reconcileOwnedArmors(draft.ownedArmors, draft.equippedArmor, draft.shield),
        weapons: draft.weapons,
        magicItems: draft.magicItems.length > 0 ? draft.magicItems : undefined,
        currency: draft.currency,
        initiative: 0,
        currentHP: 0,
        maxHP: 0,
        hpHistory: [],
        // Was previously hardcoded to [] here regardless of what the Spells
        // step collected - the wizard step existed to fill in
        // `draft.spellsKnown`, but nothing ever read it back out.
        spellsKnown: draft.spellsKnown,
        grantedSpells: draft.grantedSpells.length > 0 ? draft.grantedSpells : undefined,
        featureChoices: Object.keys(draft.featureChoices).length > 0 ? draft.featureChoices : undefined,
        languages: [...baseLanguages, ...featGrants.languages.filter((language) => !baseLanguages.includes(language))],
        details: cleanDetails(draft.details),
        visibility: draft.visibility ?? "private",
        campaignId: draft.visibility && draft.visibility !== "private" ? draft.campaignId ?? null : null,
    };

    base.initiative =
        calculateAbilityModifiers(base.abilityScores).dexterity +
        getFeatInitiativeBonuses(base.feats, calculateProficiencyBonus(base)).reduce((total, bonus) => total + bonus.value, 0);

    const conModifier = calculateAbilityModifiers(base.abilityScores).constitution;
    const hpEntries: HpClassInput[] = draft.classes.map((entry) => ({
        hitDie: entry.characterClass!.hitDie,
        level: entry.level,
        hpMethod: entry.hpMethod ?? "average",
        rolls: entry.hpRolls,
    }));
    base.hpHistory = buildHpHistory(hpEntries, conModifier);
    // Tough / Boon of Fortitude raise max HP on top of the per-level history (see utils/calculateMaxHp.ts's getMaxHpBreakdown).
    base.maxHP =
        base.hpHistory.reduce((total, entry) => total + entry.hpGained, 0) +
        getFeatHpBonuses(base.feats, getCharacterLevel(base)).reduce((total, bonus) => total + bonus.value, 0);
    base.currentHP = base.maxHP;

    return base;
}

/**
 * Re-checks everything that depends on `draft.classes` and drops whatever
 * the current class/subclass/level selection no longer allows - called
 * whenever that selection changes (see ManualWizard's revalidation effect),
 * so a player can't carry forward a skill, armor, weapon, spell, or
 * Ability Score Improvement allocation picked under a since-abandoned
 * class choice.
 *
 * Skill and equipment proficiency are checked against `classes[0]` (the
 * main class) only - the wizard doesn't offer secondary classes' own
 * (RAW-reduced) multiclass proficiency choices, so there's nothing
 * class-specific from them to validate here. Spell limits and Ability
 * Score Improvement slots, on the other hand, are genuinely combined
 * across every entry - see utils/spellcasting.ts's `getSpellLimits` and
 * utils/abilityScoreImprovements.ts's `getAsiSlots`.
 */
export function revalidateDraftForClasses(draft: CharacterDraft): CharacterDraft {
    const primary = draft.classes[0]?.characterClass;

    const skillPool = primary ? primary.proficiencies.skills.from : [];
    const skillProficiencies = draft.skillProficiencies.filter((skill) => skillPool.includes(skill));

    const equippedArmor =
        primary && draft.equippedArmor && classCanUseArmor(primary, draft.equippedArmor) ? draft.equippedArmor : undefined;
    const shield = primary && draft.shield && classCanUseArmor(primary, draft.shield) ? draft.shield : undefined;
    const weapons = primary ? draft.weapons.filter((weapon) => classCanUseWeapon(primary, weapon)) : [];

    const asiSlots = getAsiSlots(draft.classes);
    const abilityScoreImprovements = pruneAsiAllocations(asiSlots, draft.abilityScoreImprovements);

    // Feat slots tied to a class level (an ASI level taken as a feat, an Epic
    // Boon) disappear with that level - same reasoning as the ASI prune above.
    const featSelections = reconcileFeatSelections({ ...draft, feats: draft.feats });
    const feats = resolveFeatSelections(featSelections, draft.feats).map((entry) => entry.feat);
    const asiBonuses = sumAsiAllocations(asiSlotsNeedingAllocation(asiSlots, featSelections), abilityScoreImprovements);

    // Drop any feature-choice pick (Pact Boon, Fighting Style, a Circle of
    // the Land terrain, etc. - see utils/grantedSpells.ts) the class change
    // no longer offers, same reasoning as `abilityScoreImprovements` above.
    const featureChoices = pruneFeatureChoices(draft.classes, draft.featureChoices);

    const abilityScores = sumAbilityScores(
        draft.abilityScores.scores,
        draft.race?.abilityModifiers ?? {},
        draft.backgroundAbilityBonuses,
        asiBonuses,
        sumFeatAbilityBonuses(featSelections)
    );
    const limits = getSpellLimits(draft.classes, abilityScores, featureChoices);
    const spellsKnown = pruneSpellsToLimits(draft.spellsKnown, limits);

    return {
        ...draft,
        skillProficiencies,
        equippedArmor,
        shield,
        weapons,
        abilityScoreImprovements,
        featSelections,
        feats,
        featureChoices,
        spellsKnown,
    };
}
