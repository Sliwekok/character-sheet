import { AbilityScores } from "@/interfaces/Characters";
import { CharacterClass } from "@/interfaces/CharacterClass";
import { Subclass } from "@/interfaces/Subclass";
import { Race } from "@/interfaces/Race";
import { Background } from "@/interfaces/Background";
import { Edition } from "@/interfaces/Edition";
import { Feat, FeatCategory, FeatMechanics, FeatPrerequisite, FeatSelection, FeatSlotKind, FeatSpellGrant, FeatSpellOption } from "@/interfaces/Feat";
import { SkillName } from "@/interfaces/Skill";
import { Spell } from "@/interfaces/Spell";
import { getAsiSlots, sumAsiAllocations } from "@/utils/abilityScoreImprovements";
import { sumAbilityScores } from "@/utils/abilityScoreBonuses";
import type { CharacterDraft } from "@/interfaces/CharacterDraft";
import { getAvailableSpellLevelsForClasses, getEffectiveCasterProgression } from "@/utils/spellcasting";

/**
 * Everything about feats that isn't UI: which feat slots a character has
 * (ASI levels taken as a feat, 2024 Epic Boon, the background's Origin
 * feat, a species feat, DM-granted bonus feats), prerequisite checks, what
 * the player still has to choose for a feat (ability, skills, spells, ...),
 * and what a chosen feat adds to the character. See interfaces/Feat.ts for
 * the data shapes and data/featMechanics.json for the per-feat effects.
 */

export const ABILITY_KEYS: (keyof AbilityScores)[] = [
    "strength",
    "dexterity",
    "constitution",
    "intelligence",
    "wisdom",
    "charisma",
];

export const ALL_SKILLS: SkillName[] = [
    "Acrobatics",
    "Animal Handling",
    "Arcana",
    "Athletics",
    "Deception",
    "History",
    "Insight",
    "Intimidation",
    "Investigation",
    "Medicine",
    "Nature",
    "Perception",
    "Performance",
    "Persuasion",
    "Religion",
    "Sleight of Hand",
    "Stealth",
    "Survival",
];

export const ARTISAN_TOOLS = [
    "Alchemist's Supplies",
    "Brewer's Supplies",
    "Calligrapher's Supplies",
    "Carpenter's Tools",
    "Cartographer's Tools",
    "Cobbler's Tools",
    "Cook's Utensils",
    "Glassblower's Tools",
    "Jeweler's Tools",
    "Leatherworker's Tools",
    "Mason's Tools",
    "Painter's Supplies",
    "Potter's Tools",
    "Smith's Tools",
    "Tinker's Tools",
    "Weaver's Tools",
    "Woodcarver's Tools",
];

export const MUSICAL_INSTRUMENTS = [
    "Bagpipes",
    "Drum",
    "Dulcimer",
    "Flute",
    "Horn",
    "Lute",
    "Lyre",
    "Pan Flute",
    "Shawm",
    "Viol",
];

export const OTHER_TOOLS = [
    "Disguise Kit",
    "Forgery Kit",
    "Gaming Set",
    "Herbalism Kit",
    "Navigator's Tools",
    "Poisoner's Kit",
    "Thieves' Tools",
    "Vehicles (Land)",
    "Vehicles (Water)",
];

export const ALL_TOOLS = [...ARTISAN_TOOLS, ...MUSICAL_INSTRUMENTS, ...OTHER_TOOLS];

export const LANGUAGES = [
    "Common",
    "Common Sign Language",
    "Dwarvish",
    "Elvish",
    "Giant",
    "Gnomish",
    "Goblin",
    "Halfling",
    "Orc",
    "Abyssal",
    "Celestial",
    "Deep Speech",
    "Draconic",
    "Druidic",
    "Infernal",
    "Primordial",
    "Sylvan",
    "Thieves' Cant",
    "Undercommon",
];

export const ABILITY_LABELS: Record<keyof AbilityScores, string> = {
    strength: "Strength",
    dexterity: "Dexterity",
    constitution: "Constitution",
    intelligence: "Intelligence",
    wisdom: "Wisdom",
    charisma: "Charisma",
};

/** The 2024 "Ability Score Improvement" general feat IS the classic ASI - never offered as a feat pick (the ASI/feat toggle covers it). */
const ASI_FEAT_NAME = "Ability Score Improvement";

// --- Slots -------------------------------------------------------------------------------

/** The class/subclass/level shape every helper here accepts - satisfied by `DraftClassEntry` directly and by `CharacterClassLevel` via `{ characterClass: entry.class, ... }`. */
export interface FeatClassInput {
    characterClass?: CharacterClass;
    subclass?: Subclass;
    level: number;
}

export interface FeatSlot {
    /** Same string as `FeatSelection.slot`. */
    key: string;
    kind: FeatSlotKind;
    /** e.g. "Fighter level 4", "Origin feat (Acolyte)". */
    label: string;
    /** Feat categories offered first in the picker for this slot (`undefined` = no preference). */
    categories?: FeatCategory[];
    /** When set, the slot's feat is fixed (a background's named Origin feat) - only its choices are editable. */
    fixedFeatName?: string;
    /** Shown as a hint ("Gathered Whispers is recommended"). */
    recommended?: string;
    /** For "asi" slots: the matching `AsiSlot.key` (also used by `abilityScoreImprovements`). */
    asiSlotKey?: string;
    /** Whether the slot can be left empty (bonus feats can be removed instead). */
    removable?: boolean;
}

export function asiFeatSlotKey(asiSlotKey: string): string {
    return `asi:${asiSlotKey}`;
}

/** `true` if the player chose to take this ASI level as a feat instead of +2/+1+1. */
export function isAsiSlotTakenAsFeat(asiSlotKey: string, featSelections: Record<string, FeatSelection>): boolean {
    return Boolean(featSelections[asiFeatSlotKey(asiSlotKey)]);
}

/** Case/punctuation-insensitive form used to match free-text feat names ("Magic initiate; cleric", "Magic Initiate (Wizard)") against the compendium. */
function normalizeFeatName(name: string): string {
    return name
        .toLowerCase()
        .replace(/[()]/g, " ")
        .replace(/[;,]/g, " ")
        .replace(/[’']/g, "'")
        .replace(/\s+/g, " ")
        .trim();
}

export function findFeatByName(feats: Feat[], name: string): Feat | undefined {
    const exact = feats.find((feat) => feat.name === name);
    if (exact) return exact;
    const target = normalizeFeatName(name);
    return feats.find((feat) => normalizeFeatName(feat.name) === target);
}

/**
 * What a 2024 background's `originFeat` text resolves to: a specific feat
 * ("Alert", "Magic initiate; cleric"), or a category choice ("A Dark Gift
 * feat of your choice (Mist Walker is recommended)").
 */
export function resolveOriginFeat(
    background: Background | undefined,
    feats: Feat[]
): { featName?: string; categories?: FeatCategory[]; recommended?: string } | undefined {
    const text = background?.originFeat?.trim();
    if (!text) return undefined;
    const feat = findFeatByName(feats, text);
    if (feat) return { featName: feat.name };
    const recommended = /\(([^)]+?) is recommended\)/i.exec(text)?.[1];
    if (/dark gift/i.test(text)) return { categories: ["dark-gift"], recommended };
    if (/dragonmark/i.test(text)) return { categories: ["dragonmark"], recommended };
    return { categories: ["origin"], recommended };
}

/** A species/race that grants a feat: 2024 Human's Versatile (`grantedFeatChoice`), or a 2014 "Feat: You gain one feat of your choice" trait (Variant Human, Custom Lineage). */
export function getRaceFeatGrant(race: Race | undefined): { categories?: FeatCategory[] } | undefined {
    if (!race) return undefined;
    if (race.grantedFeatChoice) return { categories: [race.grantedFeatChoice.category] };
    if (race.traits.some((trait) => /^Feat: You gain (one|an?) .*feat of your choice/i.test(trait))) return {};
    return undefined;
}

/** Every 2024 "Epic Boon" class feature reached (class level 19+). */
function getEpicBoonSlots(classes: FeatClassInput[]): { key: string; className: string; level: number }[] {
    const slots: { key: string; className: string; level: number }[] = [];
    classes.forEach((entry, classIndex) => {
        if (!entry.characterClass) return;
        entry.characterClass.features
            .filter((feature) => feature.name === "Epic Boon" && feature.level <= entry.level)
            .forEach((feature) =>
                slots.push({ key: `epic:${classIndex}:${feature.level}`, className: entry.characterClass!.name, level: feature.level })
            );
    });
    return slots;
}

/**
 * Every feat slot the character currently has, in display order: origin
 * (2024 background), species, each ASI level the player has switched to
 * "take a feat", each Epic Boon, then bonus feats. ASI levels still taken
 * as a plain +2/+1+1 are NOT slots here (see `isAsiSlotTakenAsFeat`).
 */
export function getFeatSlots(input: {
    classes: FeatClassInput[];
    race?: Race;
    background?: Background;
    feats: Feat[];
    featSelections: Record<string, FeatSelection>;
}): FeatSlot[] {
    const slots: FeatSlot[] = [];
    const origin = resolveOriginFeat(input.background, input.feats);
    if (origin) {
        slots.push({
            key: "origin",
            kind: "origin",
            label: `Origin feat (${input.background!.name})`,
            categories: origin.categories,
            fixedFeatName: origin.featName,
            recommended: origin.recommended,
        });
    }
    const raceGrant = getRaceFeatGrant(input.race);
    if (raceGrant) {
        slots.push({
            key: "species",
            kind: "species",
            label: `${input.race!.name} feat`,
            categories: raceGrant.categories,
        });
    }
    for (const asi of getAsiSlots(input.classes)) {
        const key = asiFeatSlotKey(asi.key);
        if (!input.featSelections[key]) continue;
        slots.push({ key, kind: "asi", label: `${asi.className} level ${asi.level}`, asiSlotKey: asi.key });
    }
    for (const epic of getEpicBoonSlots(input.classes)) {
        slots.push({ key: epic.key, kind: "epic-boon", label: `${epic.className} level ${epic.level} - Epic Boon`, categories: ["epic-boon"] });
    }
    Object.keys(input.featSelections)
        .filter((key) => key.startsWith("bonus:"))
        .sort((a, b) => Number(a.slice(6)) - Number(b.slice(6)))
        .forEach((key, index) => slots.push({ key, kind: "bonus", label: `Bonus feat ${index + 1}`, removable: true }));
    return slots;
}

/** A free `bonus:<n>` key. */
export function nextBonusFeatSlotKey(featSelections: Record<string, FeatSelection>): string {
    const used = Object.keys(featSelections)
        .filter((key) => key.startsWith("bonus:"))
        .map((key) => Number(key.slice(6)));
    return `bonus:${used.length > 0 ? Math.max(...used) + 1 : 1}`;
}

/**
 * Drops selections whose slot no longer exists (ASI level removed, background
 * changed, ...) and keeps the fixed Origin feat in sync with the background.
 * Called by `revalidateDraftForClasses` and whenever race/background changes.
 */
export function reconcileFeatSelections(input: {
    classes: FeatClassInput[];
    race?: Race;
    background?: Background;
    feats: Feat[];
    featSelections: Record<string, FeatSelection>;
}): Record<string, FeatSelection> {
    const asiKeys = new Set(getAsiSlots(input.classes).map((slot) => asiFeatSlotKey(slot.key)));
    const epicKeys = new Set(getEpicBoonSlots(input.classes).map((slot) => slot.key));
    const origin = resolveOriginFeat(input.background, input.feats);
    const raceGrant = getRaceFeatGrant(input.race);
    const next: Record<string, FeatSelection> = {};
    for (const [key, selection] of Object.entries(input.featSelections)) {
        if (key.startsWith("asi:") && !asiKeys.has(key)) continue;
        if (key.startsWith("epic:") && !epicKeys.has(key)) continue;
        if (key === "species" && !raceGrant) continue;
        if (key === "origin") {
            if (!origin) continue;
            if (origin.featName && selection.featName !== origin.featName) continue;
        }
        next[key] = selection;
    }
    if (origin?.featName && !next.origin) {
        next.origin = { slot: "origin", featName: origin.featName };
    }
    return next;
}

/** Selections paired with their feat - selections with no (or an unknown) feat picked are skipped. */
export interface ResolvedFeatSelection {
    selection: FeatSelection;
    feat: Feat;
}

export function resolveFeatSelections(featSelections: Record<string, FeatSelection> | FeatSelection[], feats: Feat[]): ResolvedFeatSelection[] {
    const list = Array.isArray(featSelections) ? featSelections : Object.values(featSelections);
    return list
        .map((selection) => {
            const feat = selection.featName ? findFeatByName(feats, selection.featName) : undefined;
            return feat ? { selection, feat } : null;
        })
        .filter((entry): entry is ResolvedFeatSelection => entry !== null);
}

// --- Prerequisites -----------------------------------------------------------------------

/** What prerequisite checks and choice lists need to know about the character the feat is for. */
export interface FeatContext {
    edition?: Edition;
    classes: FeatClassInput[];
    race?: Race;
    background?: Background;
    /** Final scores, excluding the feat being checked's own increase. */
    abilityScores: AbilityScores;
    /** Every skill proficiency the character has from other sources. */
    skillProficiencies: SkillName[];
    /** Every skill the character already has Expertise in from other sources. */
    expertise?: SkillName[];
    savingThrows?: (keyof AbilityScores)[];
    languages?: string[];
    /** Names of the character's OTHER feats (not the one being checked). */
    otherFeats: Feat[];
    /** For spell choices. */
    spells?: Spell[];
    spellClassLists?: Record<string, string[]>;
}

export function totalLevel(classes: FeatClassInput[]): number {
    return classes.reduce((total, entry) => total + (entry.characterClass ? entry.level : 0), 0);
}

function baseRaceName(name: string): string {
    return name.split(/[;(]/)[0].trim().toLowerCase();
}

function hasClassFeature(classes: FeatClassInput[], featureName: string): boolean {
    const target = featureName.toLowerCase();
    return classes.some((entry) => {
        const features = [...(entry.characterClass?.features ?? []), ...(entry.subclass?.features ?? [])];
        return features.some((feature) => feature.level <= entry.level && feature.name.toLowerCase().startsWith(target));
    });
}

function hasArmorProficiency(ctx: FeatContext, armor: string): boolean {
    const term = armor.toLowerCase();
    const primary = ctx.classes[0]?.characterClass;
    if (primary?.proficiencies.armor.some((entry) => entry.toLowerCase().includes(term))) return true;
    return ctx.otherFeats.some((feat) => feat.mechanics?.armor?.includes(term));
}

function hasWeaponProficiency(ctx: FeatContext, weapon: string): boolean {
    const term = weapon.toLowerCase();
    return ctx.classes.some((entry) => entry.characterClass?.proficiencies.weapons.some((w) => w.toLowerCase().includes(term)));
}

function canCastSpells(ctx: FeatContext): boolean {
    if (ctx.classes.some((entry) => getEffectiveCasterProgression(entry.characterClass, entry.subclass) !== "none")) return true;
    return ctx.otherFeats.some((feat) => (feat.mechanics?.spellOptions?.length ?? 0) > 0);
}

/** Human-readable reason each unmet requirement of ONE prerequisite alternative fails ([] = met). */
function unmetRequirements(p: FeatPrerequisite, ctx: FeatContext): string[] {
    const unmet: string[] = [];
    if (p.level !== undefined) {
        if (p.className) {
            const level = ctx.classes
                .filter((entry) => entry.characterClass?.name === p.className)
                .reduce((total, entry) => total + entry.level, 0);
            if (level < p.level) unmet.push(`${p.className} level ${p.level}`);
        } else if (totalLevel(ctx.classes) < p.level) {
            unmet.push(`Level ${p.level}`);
        }
    }
    if (p.abilities && p.abilities.length > 0) {
        const ok = p.abilities.some((alt) =>
            (Object.entries(alt) as [keyof AbilityScores, number][]).every(([key, min]) => ctx.abilityScores[key] >= min)
        );
        if (!ok) {
            unmet.push(
                p.abilities
                    .map((alt) =>
                        (Object.entries(alt) as [keyof AbilityScores, number][])
                            .map(([key, min]) => `${ABILITY_LABELS[key]} ${min}`)
                            .join(" and ")
                    )
                    .join(" or ")
            );
        }
    }
    if (p.spellcasting && !canCastSpells(ctx)) unmet.push("the ability to cast spells");
    for (const required of p.feats ?? []) {
        const target = normalizeFeatName(required);
        if (!ctx.otherFeats.some((feat) => normalizeFeatName(feat.name).startsWith(target))) unmet.push(`the ${required} feat`);
    }
    if (p.races && p.races.length > 0) {
        const raceName = ctx.race?.name.toLowerCase() ?? "";
        const ok = p.races.some((required) => {
            const [base, sub] = required.toLowerCase().split(/\s*\(/);
            const subrace = sub?.replace(")", "").trim();
            return ctx.race !== undefined && baseRaceName(ctx.race.name) === base.trim() && (!subrace || raceName.includes(subrace));
        });
        if (!ok) unmet.push(p.races.join(" or "));
    }
    for (const feature of p.features ?? []) {
        if (!hasClassFeature(ctx.classes, feature)) unmet.push(`the ${feature} feature`);
    }
    if (p.armorProficiency && !hasArmorProficiency(ctx, p.armorProficiency)) unmet.push(`${p.armorProficiency} armor proficiency`);
    if (p.weaponProficiency && !hasWeaponProficiency(ctx, p.weaponProficiency)) unmet.push(`${p.weaponProficiency} weapon proficiency`);
    if (p.backgrounds && p.backgrounds.length > 0) {
        if (!p.backgrounds.some((name) => ctx.background?.name.toLowerCase() === name.toLowerCase())) unmet.push(`the ${p.backgrounds.join(" or ")} background`);
    }
    if (p.noOtherFeatOfCategory && ctx.otherFeats.some((feat) => feat.category === p.noOtherFeatOfCategory)) {
        unmet.push(`no other ${p.noOtherFeatOfCategory} feat`);
    }
    return unmet;
}

export interface PrerequisiteCheck {
    met: boolean;
    /** Why it isn't met (empty when `met`). */
    unmet: string[];
    /** Requirements the app can't verify (campaign setting, "special") - shown as a reminder. */
    unverifiable: string[];
}

/** Whether the character qualifies for `feat`. Feats without structured prerequisites always qualify. */
export function checkFeatPrerequisites(feat: Feat, ctx: FeatContext): PrerequisiteCheck {
    const alternatives = feat.mechanics?.prerequisites ?? [];
    const unverifiable = Array.from(
        new Set(
            alternatives.flatMap((p) => [...(p.campaigns ?? []).map((c) => `${c} campaign`), ...(p.other ? [p.other] : [])])
        )
    );
    if (alternatives.length === 0) return { met: true, unmet: [], unverifiable };
    const results = alternatives.map((p) => unmetRequirements(p, ctx));
    const best = results.reduce((a, b) => (b.length < a.length ? b : a));
    return { met: best.length === 0, unmet: best, unverifiable };
}

/**
 * Feats offered for a slot, minus ones that make no sense to pick there:
 * the "Ability Score Improvement" feat (that's the ASI toggle), and a
 * non-repeatable feat the character already has in another slot.
 */
export function featsAvailableForSlot(feats: Feat[], slotKey: string, featSelections: Record<string, FeatSelection>): Feat[] {
    const taken = new Set(
        Object.entries(featSelections)
            .filter(([key]) => key !== slotKey)
            .map(([, selection]) => selection.featName)
    );
    return feats.filter((feat) => feat.name !== ASI_FEAT_NAME && (feat.mechanics?.repeatable || !taken.has(feat.name)));
}

// --- Choices -----------------------------------------------------------------------------

export interface FeatChoiceRequirement {
    /** Key in `FeatSelection.choices`. */
    key: string;
    label: string;
    count: number;
    options: string[];
    /** Optional pretty labels for options (ability keys -> "Strength"). */
    optionLabels?: Record<string, string>;
}

function spellOptionIndex(mechanics: FeatMechanics, choices: Record<string, string[]>): number | undefined {
    const options = mechanics.spellOptions ?? [];
    if (options.length === 0) return undefined;
    if (options.length === 1) return 0;
    const raw = choices.spellOption?.[0];
    const index = raw === undefined ? NaN : Number(raw);
    return Number.isInteger(index) && index >= 0 && index < options.length ? index : undefined;
}

/** The spell option currently in effect for a feat selection (the only one, or the one picked). */
export function getChosenSpellOption(feat: Feat, choices: Record<string, string[]> = {}): FeatSpellOption | undefined {
    const mechanics = feat.mechanics;
    if (!mechanics) return undefined;
    const index = spellOptionIndex(mechanics, choices);
    return index === undefined ? undefined : mechanics.spellOptions![index];
}

/** Highest spell slot level the classes give (0 = none) - gates 2024 "Adept" feats' slot-level spells. */
function maxSlotLevel(classes: FeatClassInput[]): number {
    const levels = getAvailableSpellLevelsForClasses(classes);
    return Math.max(0, ...levels);
}

/** Whether a grant applies at the character's current level / slot level. */
function grantReached(grant: FeatSpellGrant, classes: FeatClassInput[]): boolean {
    if (grant.atLevel !== undefined && totalLevel(classes) < grant.atLevel) return false;
    if (grant.slotLevel !== undefined && maxSlotLevel(classes) < grant.slotLevel) return false;
    return true;
}

/** Spells in the compendium that satisfy a "choose" grant's filter. */
export function spellsMatchingFilter(grant: FeatSpellGrant, spells: Spell[], spellClassLists: Record<string, string[]> = {}): Spell[] {
    const filter = grant.choose;
    if (!filter) return [];
    if (filter.fromList) return spells.filter((spell) => filter.fromList!.includes(spell.name));
    const classSets = filter.classes?.map((name) => new Set(spellClassLists[name] ?? []));
    return spells.filter((spell) => {
        if (filter.levels && !filter.levels.includes(spell.level)) return false;
        if (filter.schools && !filter.schools.some((school) => spell.school.toLowerCase().startsWith(school.toLowerCase()))) return false;
        if (filter.ritual && !spell.ritual) return false;
        if (filter.spellAttack && !spell.mechanics?.attack) return false;
        if (classSets && classSets.length > 0 && !classSets.some((set) => set.has(spell.name))) return false;
        return true;
    });
}

function describeSpellFilter(grant: FeatSpellGrant): string {
    const filter = grant.choose ?? {};
    const levels = filter.levels ?? [];
    const levelText =
        levels.length === 0
            ? "spell"
            : levels.every((level) => level === 0)
              ? "cantrip"
              : levels.length === 1
                ? `level ${levels[0]} spell`
                : `level ${levels[0]}-${levels[levels.length - 1]} spell`;
    const parts = [
        filter.classes?.join(" or "),
        filter.schools?.join(" or "),
        filter.ritual ? "ritual" : undefined,
        levelText + (grant.count > 1 ? "s" : ""),
        filter.spellAttack ? "with an attack roll" : undefined,
    ].filter(Boolean);
    return `Choose ${grant.count} ${parts.join(" ")}`;
}

/**
 * Everything the player still has to pick for `feat`, in display order.
 * Options already granted by another source (a skill you're already
 * proficient in, a language you speak) are left out so the pick is never
 * wasted - except where the feat itself turns that into Expertise.
 */
export function getFeatChoiceRequirements(
    feat: Feat,
    choices: Record<string, string[]> = {},
    ctx?: FeatContext
): FeatChoiceRequirement[] {
    const m = feat.mechanics;
    if (!m) return [];
    const requirements: FeatChoiceRequirement[] = [];
    const abilityLabels = ABILITY_LABELS as Record<string, string>;

    if (m.abilityIncrease?.choose) {
        const { from, count, amount } = m.abilityIncrease.choose;
        requirements.push({
            key: "ability",
            label: `Ability score increase (+${amount}${count > 1 ? ` to ${count} different abilities` : ""}, max ${m.abilityIncrease.max})`,
            count,
            options: from,
            optionLabels: abilityLabels,
        });
    }

    const known = new Set(ctx?.skillProficiencies ?? []);
    const featSkills = new Set<string>([...(m.skills?.fixed ?? []), ...(choices.skills ?? []), ...(choices.skillsOrTools ?? [])]);

    if (m.skills?.choose) {
        const from = m.skills.choose.from ?? ALL_SKILLS;
        requirements.push({
            key: "skills",
            label: m.skills.expertiseIfProficient
                ? "Skill (proficiency, or Expertise if you're already proficient)"
                : `Skill proficienc${m.skills.choose.count > 1 ? "ies" : "y"}`,
            count: m.skills.choose.count,
            options: m.skills.expertiseIfProficient ? from : from.filter((skill) => !known.has(skill) || choices.skills?.includes(skill)),
        });
    }

    if (m.skillsOrTools) {
        requirements.push({
            key: "skillsOrTools",
            label: "Skills or tools (any combination)",
            count: m.skillsOrTools.count,
            options: [...ALL_SKILLS.filter((skill) => !known.has(skill) || choices.skillsOrTools?.includes(skill)), ...ALL_TOOLS],
        });
    }

    if (m.expertise?.choose) {
        const proficient = ALL_SKILLS.filter((skill) => known.has(skill) || featSkills.has(skill));
        const existing = new Set([...(ctx?.expertise ?? []), ...(m.expertise.fixed ?? [])]);
        requirements.push({
            key: "expertise",
            label: "Expertise (a skill you're proficient in)",
            count: m.expertise.choose.count,
            options: proficient.filter((skill) => !existing.has(skill) || choices.expertise?.includes(skill)),
        });
    }

    if (m.savingThrows?.choose && !m.savingThrows.matchAbilityIncrease) {
        requirements.push({
            key: "savingThrows",
            label: "Saving throw proficiency",
            count: m.savingThrows.choose.count,
            options: m.savingThrows.choose.from ?? ABILITY_KEYS,
            optionLabels: abilityLabels,
        });
    }

    if (m.tools?.choose) {
        const pool =
            m.tools.choose.from ??
            (m.tools.choose.kind === "artisan" ? ARTISAN_TOOLS : m.tools.choose.kind === "instrument" ? MUSICAL_INSTRUMENTS : ALL_TOOLS);
        requirements.push({
            key: "tools",
            label: m.tools.choose.kind === "instrument" ? "Musical instruments" : m.tools.choose.kind === "artisan" ? "Artisan's tools" : "Tool proficiencies",
            count: m.tools.choose.count,
            options: pool,
        });
    }

    if (m.languages?.choose) {
        const spoken = new Set([...(ctx?.languages ?? []), ...(m.languages.fixed ?? [])]);
        requirements.push({
            key: "languages",
            label: "Languages",
            count: m.languages.choose.count,
            options: LANGUAGES.filter((language) => !spoken.has(language) || choices.languages?.includes(language)),
        });
    }

    if (m.resistances?.choose) {
        requirements.push({
            key: "resistances",
            label: "Damage resistance",
            count: m.resistances.choose.count,
            options: m.resistances.choose.from ?? [],
        });
    }

    const spellOptions = m.spellOptions ?? [];
    if (spellOptions.length > 1) {
        requirements.push({
            key: "spellOption",
            label: "Spell list",
            count: 1,
            options: spellOptions.map((_, index) => String(index)),
            optionLabels: Object.fromEntries(spellOptions.map((option, index) => [String(index), option.name ?? `Option ${index + 1}`])),
        });
    }
    const option = getChosenSpellOption(feat, choices);
    if (option?.abilityChoice) {
        requirements.push({
            key: "spellAbility",
            label: "Spellcasting ability for these spells",
            count: 1,
            options: option.abilityChoice,
            optionLabels: abilityLabels,
        });
    }
    option?.grants.forEach((grant, index) => {
        if (!grant.choose || !ctx?.spells) return;
        if (!grantReached(grant, ctx.classes)) return;
        const matching = spellsMatchingFilter(grant, ctx.spells, ctx.spellClassLists);
        requirements.push({
            key: `spells:${index}`,
            label: `${describeSpellFilter(grant)}${grant.frequency ? ` (${grant.frequency})` : ""}`,
            count: grant.count,
            options: matching.map((spell) => spell.name),
        });
    });

    return requirements;
}

/** Whether every required choice for `feat` has exactly the required number of valid picks (or every available option, when fewer exist). */
export function isFeatSelectionComplete(feat: Feat, selection: FeatSelection, ctx?: FeatContext): boolean {
    const choices = selection.choices ?? {};
    return getFeatChoiceRequirements(feat, choices, ctx).every((requirement) => {
        const picked = choices[requirement.key] ?? [];
        const needed = Math.min(requirement.count, requirement.options.length);
        return picked.length === needed && picked.every((value) => requirement.options.includes(value));
    });
}

/** The ability bonuses a feat grants with these choices - what gets stored as `FeatSelection.abilityBonuses`. */
export function computeFeatAbilityBonuses(feat: Feat, choices: Record<string, string[]> = {}): Partial<AbilityScores> {
    const increase = feat.mechanics?.abilityIncrease;
    const totals: Partial<AbilityScores> = {};
    if (!increase) return totals;
    for (const [key, value] of Object.entries(increase.fixed ?? {}) as [keyof AbilityScores, number][]) {
        totals[key] = (totals[key] ?? 0) + value;
    }
    if (increase.choose) {
        for (const ability of (choices.ability ?? []).slice(0, increase.choose.count)) {
            if (!increase.choose.from.includes(ability as keyof AbilityScores)) continue;
            const key = ability as keyof AbilityScores;
            totals[key] = (totals[key] ?? 0) + increase.choose.amount;
        }
    }
    return totals;
}

/** Sum of every selection's stored `abilityBonuses` - the feat counterpart to `sumAsiAllocations`. */
export function sumFeatAbilityBonuses(featSelections: Record<string, FeatSelection> | FeatSelection[] | undefined): Partial<AbilityScores> {
    const list = Array.isArray(featSelections) ? featSelections : Object.values(featSelections ?? {});
    const totals: Partial<AbilityScores> = {};
    for (const selection of list) {
        for (const key of ABILITY_KEYS) {
            const value = selection.abilityBonuses?.[key];
            if (value) totals[key] = (totals[key] ?? 0) + value;
        }
    }
    return totals;
}

/** Returns `selection` with `choices[key]` replaced (and `abilityBonuses` recomputed). */
export function updateFeatChoice(feat: Feat, selection: FeatSelection, key: string, values: string[]): FeatSelection {
    const choices = { ...(selection.choices ?? {}), [key]: values };
    if (values.length === 0) delete choices[key];
    // Switching spell list invalidates the spells picked from the old one.
    if (key === "spellOption") {
        for (const choiceKey of Object.keys(choices)) {
            if (choiceKey.startsWith("spells:") || choiceKey === "spellAbility") delete choices[choiceKey];
        }
    }
    return { ...selection, choices, abilityBonuses: computeFeatAbilityBonuses(feat, choices) };
}

// --- Effects -----------------------------------------------------------------------------

export interface FeatGrants {
    skillProficiencies: SkillName[];
    expertise: SkillName[];
    savingThrows: (keyof AbilityScores)[];
    languages: string[];
    tools: string[];
    armor: string[];
    weapons: string[];
    resistances: string[];
    immunities: string[];
    conditionImmunities: string[];
    senses: Partial<Record<string, number>>;
    /** Spell names (fixed grants reached + spells picked). */
    spellNames: string[];
}

function isSkill(value: string): value is SkillName {
    return (ALL_SKILLS as string[]).includes(value);
}

/**
 * What a set of feat selections adds to a character. `baseSkills` is the
 * character's skill proficiencies from every OTHER source - it decides
 * whether a Keen Mind/Observant pick becomes proficiency or Expertise.
 */
export function getFeatGrants(resolved: ResolvedFeatSelection[], baseSkills: SkillName[], classes: FeatClassInput[] = []): FeatGrants {
    const grants: FeatGrants = {
        skillProficiencies: [],
        expertise: [],
        savingThrows: [],
        languages: [],
        tools: [],
        armor: [],
        weapons: [],
        resistances: [],
        immunities: [],
        conditionImmunities: [],
        senses: {},
        spellNames: [],
    };
    const base = new Set(baseSkills);
    const addUnique = <T,>(list: T[], value: T) => {
        if (!list.includes(value)) list.push(value);
    };

    for (const { feat, selection } of resolved) {
        const m = feat.mechanics;
        if (!m) continue;
        const choices = selection.choices ?? {};

        for (const skill of [...(m.skills?.fixed ?? []), ...((choices.skills ?? []).filter(isSkill) as SkillName[])]) {
            if (m.skills?.expertiseIfProficient && base.has(skill)) addUnique(grants.expertise, skill);
            else if (!base.has(skill)) addUnique(grants.skillProficiencies, skill);
        }
        for (const pick of choices.skillsOrTools ?? []) {
            if (isSkill(pick)) {
                if (!base.has(pick)) addUnique(grants.skillProficiencies, pick);
            } else addUnique(grants.tools, pick);
        }
        for (const skill of [...(m.expertise?.fixed ?? []), ...((choices.expertise ?? []).filter(isSkill) as SkillName[])]) {
            addUnique(grants.expertise, skill);
        }

        const saves = [...(m.savingThrows?.fixed ?? [])];
        if (m.savingThrows?.matchAbilityIncrease) saves.push(...((choices.ability ?? []) as (keyof AbilityScores)[]));
        else saves.push(...((choices.savingThrows ?? []) as (keyof AbilityScores)[]));
        saves.forEach((save) => addUnique(grants.savingThrows, save));

        [...(m.languages?.fixed ?? []), ...(choices.languages ?? [])].forEach((language) => addUnique(grants.languages, language));
        [...(m.tools?.fixed ?? []), ...(choices.tools ?? [])].forEach((tool) => addUnique(grants.tools, tool));
        (m.armor ?? []).forEach((armor) => addUnique(grants.armor, armor));
        [...(m.weapons?.fixed ?? []), ...(m.weapons?.choose ? [`${m.weapons.choose.count} ${m.weapons.choose.description}`] : [])].forEach(
            (weapon) => addUnique(grants.weapons, weapon)
        );
        [...(m.resistances?.fixed ?? []), ...(choices.resistances ?? [])].forEach((r) => addUnique(grants.resistances, r));
        (m.immunities ?? []).forEach((i) => addUnique(grants.immunities, i));
        (m.conditionImmunities ?? []).forEach((i) => addUnique(grants.conditionImmunities, i));
        for (const [sense, range] of Object.entries(m.senses ?? {})) {
            grants.senses[sense] = Math.max(grants.senses[sense] ?? 0, range ?? 0);
        }

        const option = getChosenSpellOption(feat, choices);
        option?.grants.forEach((grant, index) => {
            if (classes.length > 0 && !grantReached(grant, classes)) return;
            if (grant.spell) addUnique(grants.spellNames, grant.spell);
            for (const name of choices[`spells:${index}`] ?? []) addUnique(grants.spellNames, name);
        });
    }
    return grants;
}

export { getFeatHpBonuses, getFeatInitiativeBonuses, getFeatPassiveBonus, getFeatSpeedBonuses } from "@/utils/featBonuses";
export type { FeatStatBonus } from "@/utils/featBonuses";

/** "+1 Constitution" / "+1 Strength, +1 Dexterity" */
export function describeAbilityBonuses(bonuses: Partial<AbilityScores> | undefined): string {
    return (Object.entries(bonuses ?? {}) as [keyof AbilityScores, number][])
        .filter(([, value]) => value)
        .map(([key, value]) => `+${value} ${ABILITY_LABELS[key]}`)
        .join(", ");
}

// --- Draft / character bookkeeping -------------------------------------------------------

/** ASI slots still taken as a plain +2/+1+1 (the ones `abilityScoreImprovements` must allocate). */
export function asiSlotsNeedingAllocation<T extends { key: string }>(slots: T[], featSelections: Record<string, FeatSelection> | undefined): T[] {
    return slots.filter((slot) => !featSelections?.[asiFeatSlotKey(slot.key)]);
}

/**
 * Whether every feat slot has a feat and all of its choices made. Without
 * `ctx.spells` spell picks aren't checked (finalizeDraft has no ruleset) -
 * the Feats step checks them with the full context before letting the
 * player continue.
 */
export function areFeatSlotsComplete(
    input: { classes: FeatClassInput[]; race?: Race; background?: Background; feats: Feat[]; featSelections: Record<string, FeatSelection> },
    ctxForSlot?: (slotKey: string) => FeatContext
): boolean {
    return getFeatSlots(input).every((slot) => {
        const selection = input.featSelections[slot.key];
        if (!selection?.featName) return false;
        const feat = findFeatByName(input.feats, selection.featName);
        if (!feat) return false;
        return isFeatSelectionComplete(feat, selection, ctxForSlot?.(slot.key));
    });
}

/**
 * Skills that came from feats on a saved character - what draftFromCharacter
 * takes back out of `skillProficiencies` so the Skills step only shows the
 * class picks. A Keen Mind/Observant pick that turned into Expertise (it's in
 * `skillExpertise`) was never added as a proficiency, so it isn't claimed.
 */
export function featClaimedSkills(resolved: ResolvedFeatSelection[], skillExpertise: SkillName[]): SkillName[] {
    const claimed: SkillName[] = [];
    for (const { feat, selection } of resolved) {
        const m = feat.mechanics;
        const choices = selection.choices ?? {};
        const picks = [...(m?.skills?.fixed ?? []), ...(choices.skills ?? []), ...(choices.skillsOrTools ?? [])].filter(isSkill);
        for (const skill of picks) {
            if (m?.skills?.expertiseIfProficient && skillExpertise.includes(skill)) continue;
            if (!claimed.includes(skill)) claimed.push(skill);
        }
    }
    return claimed;
}

/**
 * Rebuilds the draft's `featSelections` from a saved character. A character
 * saved with `featSelections` gets exactly those back. One saved before feats
 * were selectable only has `feats` (an epic boon picked on the old Skills &
 * Equipment step, a D&D Beyond import's origin feat): each is placed in the
 * slot it most plausibly filled - the background's Origin feat, else a free
 * Epic Boon slot for an epic boon, else a bonus slot - with no choices made
 * and no ability bonus on record (none was ever applied), so the Feats step
 * asks for whatever the feat needs before the character can be saved again.
 */
export function featSelectionsFromCharacter(character: {
    classes: { class: CharacterClass; subclass?: Subclass; level: number }[];
    race: Race;
    background: Background;
    feats?: Feat[];
    featSelections?: FeatSelection[];
}): Record<string, FeatSelection> {
    const selections: Record<string, FeatSelection> = {};
    if (character.featSelections) {
        for (const selection of character.featSelections) selections[selection.slot] = selection;
        return selections;
    }
    const classes = character.classes.map((entry) => ({ characterClass: entry.class, subclass: entry.subclass, level: entry.level }));
    const feats = character.feats ?? [];
    const origin = resolveOriginFeat(character.background, feats);
    const freeEpicSlots = getEpicBoonSlots(classes).map((slot) => slot.key);
    let bonus = 1;
    for (const feat of feats) {
        if (origin?.featName === feat.name && !selections.origin) {
            selections.origin = { slot: "origin", featName: feat.name };
        } else if (feat.category === "epic-boon" && freeEpicSlots.length > 0) {
            const slot = freeEpicSlots.shift()!;
            selections[slot] = { slot, featName: feat.name };
        } else {
            const slot = `bonus:${bonus++}`;
            selections[slot] = { slot, featName: feat.name };
        }
    }
    return selections;
}

/**
 * The `FeatContext` for one slot of a draft: final ability scores and every
 * proficiency/language/feat the character gets from everything EXCEPT that
 * slot - so a feat's own +1 doesn't count toward its own prerequisite, and
 * its skill picks aren't hidden as "already known" by themselves.
 */
export function featContextForDraft(
    draft: CharacterDraft,
    ruleset: { feats: Feat[]; spells?: Spell[]; spellClassLists?: Record<string, string[]> },
    slotKey: string
): FeatContext {
    const others = Object.fromEntries(Object.entries(draft.featSelections).filter(([key]) => key !== slotKey));
    const otherResolved = resolveFeatSelections(others, ruleset.feats);
    const asiSlots = asiSlotsNeedingAllocation(getAsiSlots(draft.classes), draft.featSelections);
    const abilityScores = sumAbilityScores(
        draft.abilityScores.scores,
        draft.race?.abilityModifiers ?? {},
        draft.backgroundAbilityBonuses,
        sumAsiAllocations(asiSlots, draft.abilityScoreImprovements),
        sumFeatAbilityBonuses(others)
    );
    const baseSkills = [...(draft.background?.skillProficiencies ?? []), ...draft.skillProficiencies];
    const grants = getFeatGrants(otherResolved, baseSkills, draft.classes);
    return {
        edition: draft.edition,
        classes: draft.classes,
        race: draft.race,
        background: draft.background,
        abilityScores,
        skillProficiencies: [...baseSkills, ...grants.skillProficiencies],
        expertise: grants.expertise,
        savingThrows: [...(draft.classes[0]?.characterClass?.proficiencies.savingThrows ?? []), ...grants.savingThrows],
        languages: [...(draft.race?.languages ?? []), ...draft.languages, ...grants.languages],
        otherFeats: otherResolved.map((entry) => entry.feat),
        spells: ruleset.spells,
        spellClassLists: ruleset.spellClassLists,
    };
}

/** Every feat slot of a draft complete, with full context (spell picks included) - the Feats step's Continue gate. */
export function areDraftFeatSlotsComplete(
    draft: CharacterDraft,
    ruleset: { feats: Feat[]; spells?: Spell[]; spellClassLists?: Record<string, string[]> }
): boolean {
    return getFeatSlots({ ...draft, feats: ruleset.feats }).every((slot) => {
        const selection = draft.featSelections[slot.key];
        if (!selection?.featName) return false;
        const feat = findFeatByName(ruleset.feats, selection.featName);
        return Boolean(feat) && isFeatSelectionComplete(feat!, selection, featContextForDraft(draft, ruleset, slot.key));
    });
}

/** Feat-granted spell names for a draft (fixed grants reached + spells picked) - merged into `grantedSpells` by ManualWizard. */
export function getDraftFeatSpellNames(draft: CharacterDraft, feats: Feat[]): string[] {
    return getFeatGrants(resolveFeatSelections(draft.featSelections, feats), [], draft.classes).spellNames;
}

export const FEAT_CATEGORY_LABELS: Record<FeatCategory, string> = {
    origin: "Origin",
    general: "General",
    "fighting-style": "Fighting Style",
    "epic-boon": "Epic Boon",
    dragonmark: "Dragonmark",
    "dark-gift": "Dark Gift",
};

function listOrChoice(fixed: string[] | undefined, choose: { from?: string[]; count: number } | undefined, anyLabel: string): string {
    const parts: string[] = [];
    if (fixed && fixed.length > 0) parts.push(fixed.join(", "));
    if (choose) {
        const from = choose.from;
        parts.push(
            from && from.length > 0 && from.length < 10
                ? `${choose.count} of ${from.join(" / ")}`
                : `${choose.count} ${anyLabel} of your choice`
        );
    }
    return parts.join(" + ");
}

/**
 * Short one-line descriptions of what a feat DOES to the character sheet
 * ("+1 Strength or Dexterity", "Speed +10 ft.", "Spells: Misty Step + 1
 * level 1 Enchantment or Divination spell") - shown in the wizard's feat
 * picker and on the sheet's feat entries. Optional `selection` swaps
 * "choose" wording for what was actually picked.
 */
export function summarizeFeatMechanics(feat: Feat, selection?: FeatSelection): string[] {
    const m = feat.mechanics;
    if (!m) return [];
    const choices = selection?.choices ?? {};
    const lines: string[] = [];
    const ability = m.abilityIncrease;
    if (ability) {
        if (selection?.abilityBonuses && Object.keys(selection.abilityBonuses).length > 0) {
            lines.push(describeAbilityBonuses(selection.abilityBonuses));
        } else {
            const parts: string[] = [];
            if (ability.fixed) parts.push(describeAbilityBonuses(ability.fixed));
            if (ability.choose) {
                const names = ability.choose.from.map((key) => ABILITY_LABELS[key]);
                parts.push(
                    `+${ability.choose.amount} ${ability.choose.from.length === 6 ? "to any ability" : names.join(" or ")}${ability.choose.count > 1 ? ` (${ability.choose.count} abilities)` : ""}`
                );
            }
            lines.push(`${parts.join(", ")} (max ${ability.max})`);
        }
    }
    const pick = (key: string) => (choices[key] && choices[key].length > 0 ? choices[key] : undefined);
    if (m.skills) lines.push(`Skill proficiency: ${pick("skills")?.join(", ") ?? listOrChoice(m.skills.fixed, m.skills.choose, "skill")}${m.skills.expertiseIfProficient ? " (Expertise if already proficient)" : ""}`);
    if (m.skillsOrTools) lines.push(`Proficiencies: ${pick("skillsOrTools")?.join(", ") ?? `${m.skillsOrTools.count} skills or tools of your choice`}`);
    if (m.expertise) lines.push(`Expertise: ${pick("expertise")?.join(", ") ?? listOrChoice(m.expertise.fixed, m.expertise.choose, "proficient skill")}`);
    if (m.savingThrows) {
        const saves = m.savingThrows.matchAbilityIncrease
            ? pick("ability")?.map((key) => ABILITY_LABELS[key as keyof AbilityScores]).join(", ") ?? "the increased ability"
            : pick("savingThrows")?.map((key) => ABILITY_LABELS[key as keyof AbilityScores]).join(", ") ??
              listOrChoice(m.savingThrows.fixed?.map((key) => ABILITY_LABELS[key]), m.savingThrows.choose && { count: m.savingThrows.choose.count }, "saving throw");
        lines.push(`Saving throw proficiency: ${saves}`);
    }
    if (m.tools) lines.push(`Tool proficiency: ${pick("tools")?.join(", ") ?? listOrChoice(m.tools.fixed, m.tools.choose, m.tools.choose?.kind === "instrument" ? "instrument" : m.tools.choose?.kind === "artisan" ? "artisan's tool" : "tool")}`);
    if (m.languages) lines.push(`Languages: ${[...(m.languages.fixed ?? []), ...(pick("languages") ?? (m.languages.choose ? [`${m.languages.choose.count} of your choice`] : []))].join(", ")}`);
    if (m.armor) lines.push(`Armor training: ${m.armor.join(", ")}`);
    if (m.weapons) lines.push(`Weapon proficiency: ${[...(m.weapons.fixed ?? []), ...(m.weapons.choose ? [`${m.weapons.choose.count} ${m.weapons.choose.description}`] : [])].join(", ")}`);
    if (m.resistances) lines.push(`Resistance: ${pick("resistances")?.join(", ") ?? listOrChoice(m.resistances.fixed, m.resistances.choose, "damage type")}`);
    if (m.immunities?.length) lines.push(`Immunity: ${m.immunities.join(", ")}`);
    if (m.conditionImmunities?.length) lines.push(`Condition immunity: ${m.conditionImmunities.join(", ")}`);
    for (const [sense, range] of Object.entries(m.senses ?? {})) lines.push(`${sense[0].toUpperCase()}${sense.slice(1)} ${range} ft.`);
    if (m.speedBonus) lines.push(`Speed +${m.speedBonus} ft.`);
    if (m.initiativeBonus) lines.push(`Initiative +${m.initiativeBonus}`);
    if (m.initiativeProficiency) lines.push("Initiative + proficiency bonus");
    if (m.hpPerLevel) lines.push(`Max HP +${m.hpPerLevel} per character level`);
    if (m.hpFlat) lines.push(`Max HP +${m.hpFlat}`);
    if (m.passiveBonus?.perception) lines.push(`Passive Perception +${m.passiveBonus.perception}`);
    if (m.passiveBonus?.investigation) lines.push(`Passive Investigation +${m.passiveBonus.investigation}`);
    if (m.mediumArmorDexCap) lines.push(`Medium armor: Dex bonus up to +${m.mediumArmorDexCap}`);
    if (m.unarmoredBaseAc) lines.push(`Unarmored AC ${m.unarmoredBaseAc} + Dex`);
    if (m.armoredAcBonus) lines.push(`+${m.armoredAcBonus} AC while wearing armor`);
    const option = getChosenSpellOption(feat, choices);
    const spellOptions = m.spellOptions ?? [];
    if (option) {
        const spells = option.grants.map((grant, index) => {
            const picked = choices[`spells:${index}`];
            const what = grant.spell ?? (picked && picked.length > 0 ? picked.join(", ") : describeSpellFilter(grant).replace(/^Choose /, ""));
            const when = grant.slotLevel ? ` (with level ${grant.slotLevel} slots)` : grant.atLevel ? ` (from level ${grant.atLevel})` : "";
            return `${what}${grant.frequency ? ` [${grant.frequency}]` : ""}${when}`;
        });
        const ability = choices.spellAbility?.[0] as keyof AbilityScores | undefined;
        const abilityNote = ability && ABILITY_LABELS[ability] ? ` - spellcasting ability ${ABILITY_LABELS[ability]}` : "";
        lines.push(`Spells${option.name && spellOptions.length > 1 ? ` (${option.name})` : ""}: ${spells.join("; ")}${abilityNote}`);
    } else if (spellOptions.length > 1) {
        lines.push(`Spells from one of: ${spellOptions.map((o) => o.name ?? "?").join(", ")}`);
    }
    for (const feature of m.optionalFeatures ?? []) lines.push(`${feature.name}: ${feature.count} of your choice`);
    for (const note of m.notes ?? []) lines.push(note);
    return lines;
}

/** Where a saved feat came from, for the sheet: "Origin feat", "Fighter level 4", "Epic Boon", ... */
export function describeFeatSlot(slotKey: string, classes: { class: CharacterClass }[]): string {
    if (slotKey === "origin") return "Origin feat";
    if (slotKey === "species") return "Species feat";
    if (slotKey.startsWith("bonus:")) return "Bonus feat";
    const match = /^(asi|epic):(\d+):(\d+)$/.exec(slotKey);
    if (match) {
        const className = classes[Number(match[2])]?.class.name ?? "Class";
        return match[1] === "epic" ? `${className} level ${match[3]} (Epic Boon)` : `${className} level ${match[3]}`;
    }
    return "Feat";
}

/**
 * The character's feats paired with the selection that put each there (when
 * saved with one) - for the sheet's Feats list. Repeatable feats taken more
 * than once pair up in order.
 */
export function pairFeatsWithSelections(feats: Feat[], featSelections: FeatSelection[] | undefined): { feat: Feat; selection?: FeatSelection }[] {
    const remaining = [...(featSelections ?? [])];
    return feats.map((feat) => {
        const index = remaining.findIndex((selection) => selection.featName === feat.name);
        const selection = index >= 0 ? remaining.splice(index, 1)[0] : undefined;
        return { feat, selection };
    });
}
