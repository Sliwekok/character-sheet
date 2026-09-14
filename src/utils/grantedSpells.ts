import { Spell } from "@/interfaces/Spell";
import { CharacterClass, ClassFeature, FeatureChoice, GrantedSpell } from "@/interfaces/CharacterClass";
import { Subclass } from "@/interfaces/Subclass";

/**
 * Minimal shape the functions below need from a class-and-level entry -
 * both `DraftClassEntry` (interfaces/CharacterDraft.ts) and
 * `CharacterClassLevel` (interfaces/Characters.ts, via a small field-name
 * adapter) satisfy this once mapped to it, mirroring
 * utils/abilityScoreImprovements.ts's `AsiClassInput` and
 * utils/spellcasting.ts's `SpellcasterEntry` - the same "reduce every
 * caller to one small shared shape" pattern those two already use.
 */
export interface GrantEntryInput {
    characterClass?: CharacterClass;
    subclass?: Subclass;
    level: number;
}

/**
 * Stable key identifying one `FeatureChoice` on one class-entry, for
 * storage in `CharacterDraft.featureChoices`/`Character.featureChoices` -
 * `${classIndex}:${feature.name}:${choice.key}`, mirroring
 * utils/abilityScoreImprovements.ts's `AsiSlot.key` convention
 * (`${classIndex}:${level}`). Included even though a feature only ever
 * carries one `choice`, so the key stays unambiguous if the data shape
 * ever changes.
 */
export function featureChoiceKey(classIndex: number, feature: ClassFeature): string {
    return `${classIndex}:${feature.name}:${feature.choice?.key ?? ""}`;
}

/**
 * How many options `choice` lets the player pick at once, for an entry at
 * `level` (the entry's OWN class level, same convention `feature.level`
 * itself uses) - 1 for every ordinary single-select choice (`countByLevel`
 * unset), or the highest `countByLevel` threshold at or below `level` for a
 * multi-select one (e.g. a Warlock's Eldritch Invocations) - see
 * `FeatureChoice.countByLevel`'s header comment. Falls back to 0 if
 * `countByLevel` is set but `level` hasn't reached its lowest threshold yet
 * (shouldn't normally happen - `getFeatureChoices` only surfaces a choice
 * once `feature.level <= level`, and a feature's own granting level is
 * always included as a `countByLevel` threshold in every class that uses
 * this - but a data mistake degrades to "nothing pickable yet" rather than
 * a crash).
 */
export function featureChoiceMaxSelections(choice: FeatureChoice, level: number): number {
    if (!choice.countByLevel) return 1;
    const thresholds = Object.keys(choice.countByLevel)
        .map(Number)
        .filter((threshold) => threshold <= level)
        .sort((a, b) => b - a);
    return thresholds.length > 0 ? choice.countByLevel[thresholds[0]] : 0;
}

/**
 * Decodes one `CharacterDraft.featureChoices`/`Character.featureChoices`
 * entry into the list of selected `FeatureChoiceOption.id`s it represents -
 * a single-select choice's stored value (a bare option id, e.g. `"chain"`)
 * decodes to a one-element array, same as a multi-select choice's
 * comma-joined value (e.g. `"agonizing-blast,devils-sight"`) decodes to
 * each id - so every caller can treat every choice uniformly as "a list of
 * picks" regardless of whether it's single- or multi-select. `undefined`
 * (not yet resolved) decodes to `[]`.
 */
export function decodeFeatureChoiceSelection(raw: string | undefined): string[] {
    return raw ? raw.split(",").filter(Boolean) : [];
}

/** Inverse of `decodeFeatureChoiceSelection` - what actually gets stored in `featureChoices`. A one-element array round-trips to the exact same bare-id string a single-select choice always stored, so this is backward compatible with every character saved before multi-select choices existed. */
export function encodeFeatureChoiceSelection(ids: string[]): string {
    return ids.join(",");
}

/** One feature-gated choice the player has (or hasn't yet) resolved, reached at the entry's current level - what ClassStep renders a picker for. */
export interface PendingFeatureChoice {
    key: string;
    classIndex: number;
    className: string;
    featureName: string;
    level: number;
    choice: FeatureChoice;
    /** How many of `choice.options` can be selected at once, at this entry's current level - see `featureChoiceMaxSelections()`. Always 1 for a single-select choice. */
    maxSelections: number;
}

/**
 * Every `FeatureChoice` the given classes/levels have reached (base class
 * and subclass features alike) - regardless of whether the player has
 * resolved it yet. ClassStep renders one picker per entry here, bound to
 * `CharacterDraft.featureChoices[entry.key]`.
 */
export function getFeatureChoices(classes: GrantEntryInput[]): PendingFeatureChoice[] {
    const result: PendingFeatureChoice[] = [];
    classes.forEach((entry, classIndex) => {
        if (!entry.characterClass && !entry.subclass) return;
        const fromClass = entry.characterClass?.features ?? [];
        const fromSubclass = entry.subclass?.features ?? [];
        [...fromClass, ...fromSubclass].forEach((feature) => {
            if (!feature.choice || feature.level > entry.level) return;
            result.push({
                key: featureChoiceKey(classIndex, feature),
                classIndex,
                className: entry.characterClass?.name ?? entry.subclass?.parentClass ?? "",
                featureName: feature.name,
                level: feature.level,
                choice: feature.choice,
                maxSelections: featureChoiceMaxSelections(feature.choice, entry.level),
            });
        });
    });
    return result;
}

/**
 * Whether every currently-reached `FeatureChoice` (a Pact Boon, a Fighting
 * Style, a Circle of the Land terrain, ...) has actually been resolved -
 * used to gate the Class step (and the final Review check) the same way
 * `areAsiSlotsComplete` gates Ability Score Improvements, so a player can't
 * finish building a Fighter without picking a Fighting Style.
 */
export function areFeatureChoicesComplete(
    classes: GrantEntryInput[],
    choices: Record<string, string>
): boolean {
    return getFeatureChoices(classes).every(
        (pending) => decodeFeatureChoiceSelection(choices[pending.key]).length === pending.maxSelections
    );
}

/**
 * Drops any `featureChoices` entry that no longer corresponds to a
 * currently-reached `FeatureChoice` - e.g. the class/subclass that offered
 * it was swapped away, or the level dropped back below it - mirroring
 * utils/abilityScoreImprovements.ts's `pruneAsiAllocations`. For a
 * multi-select choice (see `FeatureChoice.countByLevel`), also drops any
 * individual selected id that's no longer one of that choice's options and
 * trims back down to the current `maxSelections` if the level (and so the
 * pick count) dropped - e.g. de-leveling out of an Eldritch Invocation slot
 * keeps whichever invocations were picked FIRST, same "keep what was
 * already there" spirit as utils/spellcasting.ts's `pruneSpellsToLimits`.
 */
export function pruneFeatureChoices(
    classes: GrantEntryInput[],
    choices: Record<string, string>
): Record<string, string> {
    const pending = getFeatureChoices(classes);
    const byKey = new Map(pending.map((entry) => [entry.key, entry]));
    const next: Record<string, string> = {};
    for (const [key, raw] of Object.entries(choices)) {
        const entry = byKey.get(key);
        if (!entry) continue;
        const validIds = new Set(entry.choice.options.map((option) => option.id));
        const selected = decodeFeatureChoiceSelection(raw)
            .filter((id) => validIds.has(id))
            .slice(0, entry.maxSelections);
        if (selected.length > 0) next[key] = encodeFeatureChoiceSelection(selected);
    }
    return next;
}

/**
 * Every `GrantedSpell` one reached feature actually applies for this
 * entry - its own unconditional `grantedSpells` (each filtered by its own
 * `atLevel` override, defaulting to the feature's `level`, for a grant
 * that unlocks later than the feature itself - e.g. Circle of the Land's
 * terrain spells), plus whichever option's `grantedSpells` the player
 * picked for `feature.choice`, if any and if resolved yet.
 */
function resolvedGrantsForFeature(
    feature: ClassFeature,
    level: number,
    key: string,
    featureChoices: Record<string, string>
): GrantedSpell[] {
    if (feature.level > level) return [];
    const atLevel = (grant: GrantedSpell) => (grant.atLevel ?? feature.level) <= level;
    const unconditional = (feature.grantedSpells ?? []).filter(atLevel);
    if (!feature.choice) return unconditional;
    // Every option the player has picked so far, not just one - a
    // multi-select choice (e.g. Eldritch Invocations) can have several
    // resolved at once, each with its own `grantedSpells` - see
    // `decodeFeatureChoiceSelection`'s header comment.
    const selectedIds = decodeFeatureChoiceSelection(featureChoices[key]);
    const chosenOptions = feature.choice.options.filter((option) => selectedIds.includes(option.id));
    const fromChoice = chosenOptions.flatMap((option) => (option.grantedSpells ?? []).filter(atLevel));
    return [...unconditional, ...fromChoice];
}

/** Every `GrantedSpell` reached across every class/subclass entry, choices already resolved - the single traversal `getAutoGrantedSpellNames`/`getBonusSpellCaps` both build on. */
function reachedGrants(classes: GrantEntryInput[], featureChoices: Record<string, string>): GrantedSpell[] {
    const grants: GrantedSpell[] = [];
    classes.forEach((entry, classIndex) => {
        const fromClass = entry.characterClass?.features ?? [];
        const fromSubclass = entry.subclass?.features ?? [];
        [...fromClass, ...fromSubclass].forEach((feature) => {
            const key = featureChoiceKey(classIndex, feature);
            grants.push(...resolvedGrantsForFeature(feature, entry.level, key, featureChoices));
        });
    });
    return grants;
}

/**
 * Every spell name automatically granted (no further player choice
 * involved) by any class/subclass feature at or below each entry's current
 * level - both unconditional grants (e.g. a Psi Warrior's Telekinetic
 * Master, a Wizard's Improved Minor Illusion) and, once the relevant
 * `featureChoices` entry is resolved, a choice-gated grant that names a
 * fixed spell (e.g. Pact of the Tome's... actually a free pick, see
 * `getBonusSpellCaps` - but Giant Power's Druidcraft/Thaumaturgy, Divine
 * Order's Thaumaturge cantrip, or Circle of the Land's terrain spells all
 * qualify here). These become bonus known spells with no further wizard
 * interaction beyond resolving the choice itself - see
 * `resolveSpellsByName` for turning this into actual `Spell` objects, and
 * ManualWizard for where that gets recomputed. `featureChoices` defaults
 * to `{}` (no choices resolved yet) so existing callers that don't have
 * any choice-gated data don't need to change.
 */
export function getAutoGrantedSpellNames(
    classes: GrantEntryInput[],
    featureChoices: Record<string, string> = {}
): string[] {
    const names = new Set<string>();
    reachedGrants(classes, featureChoices).forEach((grant) => {
        if (grant.spellName) names.add(grant.spellName);
    });
    return [...names];
}

/** Looks up each name in `allSpells` (edition-agnostic - see interfaces/Spell.ts), silently dropping any that can't be found rather than throwing, since a stale/typo'd name shouldn't crash character finalization. */
export function resolveSpellsByName(names: string[], allSpells: Spell[]): Spell[] {
    const byName = new Map(allSpells.map((spell) => [spell.name, spell]));
    return names.map((name) => byName.get(name)).filter((spell): spell is Spell => Boolean(spell));
}

export interface BonusSpellCaps {
    /** Extra cantrips knowable, beyond the normal per-class caps - from a `choice` grant at spellLevel 0 (unconditional, or from a resolved feature choice - e.g. Pact of the Tome's "choose 3 cantrips from any list"). */
    cantrips: number;
    /** Extra leveled spells knowable, beyond the normal per-class caps - from a `choice` grant at spellLevel 1-9. */
    leveled: number;
    /** Spell levels a `choice` grant makes available even if slot progression alone wouldn't (e.g. a Warlock's Mystic Arcanum reaching 6th-9th level spells well above Pact Magic's own 5th-level cap). */
    extraLevels: number[];
}

/**
 * Bonus known-spell caps from every earned `choice`-type grant (e.g. a
 * Warlock's Mystic Arcanum: "choose one 6th-level spell", or - once chosen
 * - Pact of the Tome's "choose three cantrips from any class's spell
 * list") - this app has no per-class spell list (see
 * utils/spellcasting.ts's header comment), so rather than a separate
 * picker UI, these are folded straight into getSpellLimits()'s existing
 * caps/available-levels and the player just picks the bonus spell(s) in
 * the normal Spells step, same simplification every other spell limit in
 * this app already makes. `featureChoices` defaults to `{}`, same as
 * `getAutoGrantedSpellNames` above.
 */
export function getBonusSpellCaps(
    classes: GrantEntryInput[],
    featureChoices: Record<string, string> = {}
): BonusSpellCaps {
    let cantrips = 0;
    let leveled = 0;
    const extraLevels = new Set<number>();
    reachedGrants(classes, featureChoices).forEach((grant) => {
        if (!grant.choice) return;
        if (grant.choice.spellLevel === 0) cantrips += grant.choice.count;
        else leveled += grant.choice.count;
        extraLevels.add(grant.choice.spellLevel);
    });
    return { cantrips, leveled, extraLevels: [...extraLevels] };
}
