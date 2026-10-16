"use client";

import { useMemo, useState } from "react";
import { Ruleset } from "@/data";
import { CharacterDraft } from "@/interfaces/CharacterDraft";
import { Feat, FeatCategory, FeatSelection } from "@/interfaces/Feat";
import { Spell } from "@/interfaces/Spell";
import { SpellDetailPanel, actionLabel, levelLabel } from "./SpellsStep";
import { Badge, Button, Card, CardContent, Combobox, TextInput } from "@/components/ui";
import { cn } from "@/utils/cn";
import { getAsiSlots } from "@/utils/abilityScoreImprovements";
import {
    FEAT_CATEGORY_LABELS,
    FeatChoiceRequirement,
    FeatContext,
    FeatSlot,
    asiFeatSlotKey,
    checkFeatPrerequisites,
    featContextForDraft,
    featsAvailableForSlot,
    findFeatByName,
    getFeatChoiceRequirements,
    getFeatSlots,
    isFeatSelectionComplete,
    nextBonusFeatSlotKey,
    summarizeFeatMechanics,
    updateFeatChoice,
    computeFeatAbilityBonuses,
} from "@/utils/feats";

type FeatsStepProps = {
    ruleset: Ruleset;
    draft: CharacterDraft;
    /** Called with the full next `featSelections` - ManualWizard syncs `draft.feats` and drops ASI allocations for levels switched to a feat. */
    onChange: (featSelections: Record<string, FeatSelection>) => void;
};

function pillClass(selected: boolean, disabled?: boolean): string {
    return cn(
        "cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        selected
            ? "border-foreground bg-foreground text-background-darken"
            : "border-border-strong text-fontcolor-secondary hover:border-foreground",
        disabled && "cursor-not-allowed opacity-40"
    );
}

/** Two-button "+2/+1+1 | Feat" switch for one Ability Score Improvement level. */
export function AsiOrFeatToggle({
    takenAsFeat,
    onChange,
}: {
    takenAsFeat: boolean;
    onChange: (takeFeat: boolean) => void;
}) {
    return (
        <div className="inline-flex overflow-hidden rounded-full border border-border-strong text-xs font-semibold">
            <button
                type="button"
                onClick={() => onChange(false)}
                className={cn("cursor-pointer px-3 py-1 transition-colors", !takenAsFeat ? "bg-foreground text-background-darken" : "text-fontcolor-secondary hover:text-fontcolor")}
            >
                Ability scores
            </button>
            <button
                type="button"
                onClick={() => onChange(true)}
                className={cn("cursor-pointer px-3 py-1 transition-colors", takenAsFeat ? "bg-foreground text-background-darken" : "text-fontcolor-secondary hover:text-fontcolor")}
            >
                Feat
            </button>
        </div>
    );
}

/**
 * Wizard step for every feat the character gets: the 2024 background's
 * Origin feat, a species feat (2024 Human's Versatile, 2014 Variant Human /
 * Custom Lineage), Ability Score Improvement levels taken as a feat, 2024
 * Epic Boons and DM-granted bonus feats. For each it offers a searchable
 * feat list (filtered to what the character qualifies for by default) and
 * then every choice the picked feat needs - ability increase, skills,
 * expertise, tools, languages, resistances, spell list and spells - since
 * those are what actually change the saved character (see utils/feats.ts
 * and utils/characterDraft.ts's finalizeDraft).
 */
export function FeatsStep({ ruleset, draft, onChange }: FeatsStepProps) {
    const asiSlots = getAsiSlots(draft.classes);
    const slots = getFeatSlots({ ...draft, feats: ruleset.feats });

    function setSelection(key: string, selection: FeatSelection | undefined) {
        const next = { ...draft.featSelections };
        if (selection) next[key] = selection;
        else delete next[key];
        onChange(next);
    }

    function toggleAsi(asiKey: string, takeFeat: boolean) {
        const key = asiFeatSlotKey(asiKey);
        setSelection(key, takeFeat ? draft.featSelections[key] ?? { slot: key, featName: "" } : undefined);
    }

    function addBonusFeat() {
        const key = nextBonusFeatSlotKey(draft.featSelections);
        setSelection(key, { slot: key, featName: "" });
    }

    return (
        <div className="flex flex-col gap-6">
            <Card>
                <CardContent className="flex flex-col gap-2 text-sm text-fontcolor-secondary">
                    <p>
                        Feats your character gets from their background, species and class levels. Picking a feat applies what it
                        does to the character sheet - ability score increases, proficiencies, Expertise, languages, extra spells,
                        and bonuses to speed, initiative, HP or AC.
                    </p>
                    {draft.edition === "2024" && (
                        <p>Every Ability Score Improvement level can be taken as a feat instead of +2 / +1+1 - switch it below.</p>
                    )}
                </CardContent>
            </Card>

            {asiSlots.length > 0 && (
                <Card>
                    <CardContent className="flex flex-col gap-3">
                        <p className="text-sm font-medium text-fontcolor">Ability Score Improvement levels</p>
                        <div className="flex flex-col divide-y divide-border">
                            {asiSlots.map((slot) => {
                                const takenAsFeat = Boolean(draft.featSelections[asiFeatSlotKey(slot.key)]);
                                return (
                                    <div key={slot.key} className="flex flex-wrap items-center justify-between gap-3 py-2">
                                        <span className="text-sm text-fontcolor-secondary">
                                            {slot.className} level {slot.level}
                                            {!takenAsFeat && " - ability scores are assigned on the Ability Scores step"}
                                        </span>
                                        <AsiOrFeatToggle takenAsFeat={takenAsFeat} onChange={(takeFeat) => toggleAsi(slot.key, takeFeat)} />
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {slots.length === 0 && (
                <Card>
                    <CardContent className="text-sm text-fontcolor-secondary">
                        No feats to pick yet.{" "}
                        {asiSlots.length > 0
                            ? "Switch an Ability Score Improvement level above to \"Feat\" to take one there."
                            : "Feats come from a 2024 background, some species, Ability Score Improvement levels and Epic Boons."}
                    </CardContent>
                </Card>
            )}

            {slots.map((slot) => (
                <FeatSlotCard
                    key={slot.key}
                    slot={slot}
                    ruleset={ruleset}
                    draft={draft}
                    selection={draft.featSelections[slot.key]}
                    onChange={(selection) => setSelection(slot.key, selection)}
                    onRemove={slot.removable ? () => setSelection(slot.key, undefined) : undefined}
                />
            ))}

            <div>
                <Button variant="secondary" size="sm" onClick={addBonusFeat}>
                    + Add a bonus feat
                </Button>
                <p className="mt-2 text-xs text-fontcolor-secondary">For an extra feat your DM granted (a reward, a campaign boon, a starting feat house rule).</p>
            </div>
        </div>
    );
}

function FeatSlotCard({
    slot,
    ruleset,
    draft,
    selection,
    onChange,
    onRemove,
}: {
    slot: FeatSlot;
    ruleset: Ruleset;
    draft: CharacterDraft;
    selection: FeatSelection | undefined;
    onChange: (selection: FeatSelection) => void;
    onRemove?: () => void;
}) {
    const ctx = useMemo(() => featContextForDraft(draft, ruleset, slot.key), [draft, ruleset, slot.key]);
    const feat = selection?.featName ? findFeatByName(ruleset.feats, selection.featName) : undefined;
    const complete = Boolean(feat && selection && isFeatSelectionComplete(feat, selection, ctx));

    function pickFeat(next: Feat) {
        onChange({ slot: slot.key, featName: next.name, abilityBonuses: computeFeatAbilityBonuses(next, {}), choices: {} });
    }

    return (
        <Card className={cn(complete ? undefined : "border-foreground/40")}>
            <CardContent className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium text-fontcolor">{slot.label}</p>
                    <div className="flex items-center gap-2">
                        <Badge variant={complete ? "solid" : "outline"}>{complete ? "Done" : feat ? "Choices needed" : "Choose a feat"}</Badge>
                        {onRemove && (
                            <Button variant="ghost" size="sm" onClick={onRemove}>
                                Remove
                            </Button>
                        )}
                    </div>
                </div>

                {slot.fixedFeatName ? (
                    <p className="text-sm text-fontcolor-secondary">
                        Granted by your background: <span className="font-semibold text-fontcolor">{slot.fixedFeatName}</span>
                        {!feat && " (not found in this edition's feat list)"}
                    </p>
                ) : (
                    <FeatPicker slot={slot} ruleset={ruleset} draft={draft} ctx={ctx} value={feat} onPick={pickFeat} />
                )}

                {feat && selection && <FeatDetails feat={feat} selection={selection} ctx={ctx} spells={ruleset.spells} onChange={onChange} />}
            </CardContent>
        </Card>
    );
}

function FeatPicker({
    slot,
    ruleset,
    draft,
    ctx,
    value,
    onPick,
}: {
    slot: FeatSlot;
    ruleset: Ruleset;
    draft: CharacterDraft;
    ctx: FeatContext;
    value: Feat | undefined;
    onPick: (feat: Feat) => void;
}) {
    const [category, setCategory] = useState<FeatCategory | "all">(slot.categories?.[0] ?? "all");
    const [onlyQualified, setOnlyQualified] = useState(true);

    const available = useMemo(
        () => featsAvailableForSlot(ruleset.feats, slot.key, draft.featSelections),
        [ruleset.feats, slot.key, draft.featSelections]
    );
    const checks = useMemo(() => new Map(available.map((feat) => [feat.name, checkFeatPrerequisites(feat, ctx)])), [available, ctx]);
    const categories = useMemo(
        () => (Object.keys(FEAT_CATEGORY_LABELS) as FeatCategory[]).filter((c) => available.some((feat) => feat.category === c)),
        [available]
    );
    const options = available
        .filter((feat) => category === "all" || feat.category === category)
        .filter((feat) => !onlyQualified || checks.get(feat.name)?.met)
        .sort((a, b) => a.name.localeCompare(b.name));

    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
                <button type="button" className={pillClass(category === "all")} onClick={() => setCategory("all")}>
                    All
                </button>
                {categories.map((c) => (
                    <button key={c} type="button" className={pillClass(category === c)} onClick={() => setCategory(c)}>
                        {FEAT_CATEGORY_LABELS[c]}
                    </button>
                ))}
                <label className="ml-auto flex cursor-pointer items-center gap-2 text-xs text-fontcolor-secondary">
                    <input type="checkbox" checked={onlyQualified} onChange={(event) => setOnlyQualified(event.target.checked)} />
                    Only feats I qualify for
                </label>
            </div>
            <Combobox
                className="w-full"
                options={options}
                value={value ?? null}
                getOptionLabel={(feat) => {
                    const check = checks.get(feat.name);
                    return `${feat.name} · ${FEAT_CATEGORY_LABELS[feat.category]}${check && !check.met ? " (requirements not met)" : ""}`;
                }}
                getOptionValue={(feat) => feat.name}
                onChange={onPick}
                placeholder={options.length > 0 ? `Search ${options.length} feats...` : "No feats match these filters"}
            />
            {slot.recommended && <p className="text-xs text-fontcolor-secondary">{slot.recommended} is recommended.</p>}
        </div>
    );
}

function FeatDetails({
    feat,
    selection,
    ctx,
    spells,
    onChange,
}: {
    feat: Feat;
    selection: FeatSelection;
    ctx: FeatContext;
    /** The compendium - spell picks ("spells:<n>" requirements) get the full Spells-step style browser. */
    spells: Spell[];
    onChange: (selection: FeatSelection) => void;
}) {
    const [showDescription, setShowDescription] = useState(false);
    const prereq = checkFeatPrerequisites(feat, ctx);
    const requirements = getFeatChoiceRequirements(feat, selection.choices ?? {}, ctx);
    const effects = summarizeFeatMechanics(feat, selection);

    return (
        <div className="flex flex-col gap-3 rounded-(--radius) border border-border bg-background-elevated/30 p-4">
            <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-fontcolor">{feat.name}</span>
                <Badge variant="outline">{FEAT_CATEGORY_LABELS[feat.category]}</Badge>
                {feat.prerequisite && <Badge variant="muted">Requires {feat.prerequisite}</Badge>}
            </div>
            {!prereq.met && (
                <p className="text-xs text-red-400">You don&apos;t meet: {prereq.unmet.join("; ")}. Pick it anyway only if your DM allows it.</p>
            )}
            {prereq.unverifiable.length > 0 && (
                <p className="text-xs text-fontcolor-secondary">Also requires: {prereq.unverifiable.join(", ")} - check with your DM.</p>
            )}
            {effects.length > 0 && (
                <ul className="list-disc pl-5 text-xs text-fontcolor">
                    {effects.map((line) => (
                        <li key={line}>{line}</li>
                    ))}
                </ul>
            )}
            <button
                type="button"
                className="w-fit cursor-pointer text-xs text-fontcolor-secondary underline hover:text-fontcolor"
                onClick={() => setShowDescription((open) => !open)}
            >
                {showDescription ? "Hide full description" : "Show full description"}
            </button>
            {showDescription && <p className="whitespace-pre-line text-xs text-fontcolor-secondary">{feat.description}</p>}

            {requirements.map((requirement) =>
                requirement.key.startsWith("spells:") ? (
                    <FeatSpellPicker
                        key={requirement.key}
                        requirement={requirement}
                        spells={spells}
                        picked={selection.choices?.[requirement.key] ?? []}
                        onChange={(values) => onChange(updateFeatChoice(feat, selection, requirement.key, values))}
                    />
                ) : (
                    <ChoicePicker
                        key={requirement.key}
                        requirement={requirement}
                        picked={selection.choices?.[requirement.key] ?? []}
                        onChange={(values) => onChange(updateFeatChoice(feat, selection, requirement.key, values))}
                    />
                )
            )}
        </div>
    );
}

/** Lists with more options than this get a search box. */
const SEARCH_THRESHOLD = 24;
/** Most pills rendered at once for a searchable list. */
const MAX_VISIBLE = 60;

function ChoicePicker({
    requirement,
    picked,
    onChange,
}: {
    requirement: FeatChoiceRequirement;
    picked: string[];
    onChange: (values: string[]) => void;
}) {
    const [query, setQuery] = useState("");
    const needed = Math.min(requirement.count, requirement.options.length);
    const label = (value: string) => requirement.optionLabels?.[value] ?? value;
    const searchable = requirement.options.length > SEARCH_THRESHOLD;
    const filtered = requirement.options.filter((option) => !query || label(option).toLowerCase().includes(query.toLowerCase()));
    const visible = searchable ? [...picked.filter((value) => !filtered.includes(value)), ...filtered].slice(0, MAX_VISIBLE + picked.length) : filtered;

    function toggle(value: string) {
        if (picked.includes(value)) onChange(picked.filter((v) => v !== value));
        else if (requirement.count === 1) onChange([value]);
        else if (picked.length < requirement.count) onChange([...picked, value]);
    }

    return (
        <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-fontcolor-secondary">
                {requirement.label} - {picked.length}/{needed}
            </p>
            {requirement.options.length === 0 ? (
                <p className="text-xs text-fontcolor-secondary">Nothing left to choose from here.</p>
            ) : (
                <>
                    {searchable && (
                        <TextInput placeholder="Filter..." value={query} onChange={(event) => setQuery(event.target.value)} />
                    )}
                    <div className="flex flex-wrap gap-2">
                        {visible.map((option) => {
                            const selected = picked.includes(option);
                            const disabled = !selected && requirement.count > 1 && picked.length >= requirement.count;
                            return (
                                <button key={option} type="button" disabled={disabled} className={pillClass(selected, disabled)} onClick={() => toggle(option)}>
                                    {label(option)}
                                </button>
                            );
                        })}
                    </div>
                    {searchable && filtered.length > MAX_VISIBLE && (
                        <p className="text-xs text-fontcolor-secondary">Showing {MAX_VISIBLE} of {filtered.length} - type to narrow it down.</p>
                    )}
                </>
            )}
        </div>
    );
}

/**
 * A feat's "choose N spells" pick, laid out like the Spells step: search,
 * level and casting-time filters, a scrollable list with level/school
 * badges, the chosen spells as removable pills, and a detail panel with
 * the full spell text. Only spells matching the feat's filter (class list,
 * school, level, ritual, ...) are offered - see `requirement.options`.
 */
function FeatSpellPicker({
    requirement,
    spells,
    picked,
    onChange,
}: {
    requirement: FeatChoiceRequirement;
    spells: Spell[];
    picked: string[];
    onChange: (values: string[]) => void;
}) {
    const options = useMemo(() => {
        const allowed = new Set(requirement.options);
        return spells.filter((spell) => allowed.has(spell.name)).sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
    }, [spells, requirement.options]);
    const [search, setSearch] = useState("");
    const [levelFilter, setLevelFilter] = useState<number | "all">("all");
    const [actionFilter, setActionFilter] = useState<string | "all">("all");
    const [previewSpell, setPreviewSpell] = useState<Spell | undefined>(() => options.find((spell) => picked.includes(spell.name)));

    const needed = Math.min(requirement.count, options.length);
    const levels = [...new Set(options.map((spell) => spell.level))].sort((a, b) => a - b);
    const actions = [...new Set(options.map((spell) => spell.castingTime))];
    const query = search.trim().toLowerCase();
    const filtered = options
        .filter((spell) => levelFilter === "all" || spell.level === levelFilter)
        .filter((spell) => actionFilter === "all" || spell.castingTime === actionFilter)
        .filter((spell) => !query || spell.name.toLowerCase().includes(query));

    const isSelected = (spell: Spell) => picked.includes(spell.name);
    const isCapped = (spell: Spell) => !isSelected(spell) && requirement.count > 1 && picked.length >= requirement.count;

    function toggle(spell: Spell) {
        setPreviewSpell(spell);
        if (isSelected(spell)) onChange(picked.filter((name) => name !== spell.name));
        else if (requirement.count === 1) onChange([spell.name]);
        else if (!isCapped(spell)) onChange([...picked, spell.name]);
    }

    return (
        <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-fontcolor-secondary">
                {requirement.label} - {picked.length}/{needed} chosen
            </p>
            {options.length === 0 ? (
                <p className="text-xs text-fontcolor-secondary">No spells in the compendium match this feat&apos;s list.</p>
            ) : (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
                    <div className="flex flex-col gap-3">
                        <div className="flex flex-wrap items-center gap-3">
                            <TextInput value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search spells..." className="max-w-xs" />
                            {levels.length > 1 && (
                                <div className="flex flex-wrap gap-2">
                                    <button type="button" onClick={() => setLevelFilter("all")} className={pillClass(levelFilter === "all")}>
                                        All
                                    </button>
                                    {levels.map((level) => (
                                        <button key={level} type="button" onClick={() => setLevelFilter(level)} className={pillClass(levelFilter === level)}>
                                            {levelLabel(level)}
                                        </button>
                                    ))}
                                </div>
                            )}
                            {actions.length > 1 && (
                                <div className="flex flex-wrap gap-2">
                                    <button type="button" onClick={() => setActionFilter("all")} className={pillClass(actionFilter === "all")}>
                                        All
                                    </button>
                                    {actions.map((action) => (
                                        <button key={action} type="button" onClick={() => setActionFilter(action)} className={pillClass(actionFilter === action)}>
                                            {actionLabel(action)}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-fontcolor-secondary">{filtered.length} shown</p>
                        <div className="flex max-h-[22rem] flex-col gap-1 overflow-y-auto pr-1">
                            {filtered.map((spell) => {
                                const selected = isSelected(spell);
                                const capped = isCapped(spell);
                                return (
                                    <button
                                        key={spell.name}
                                        type="button"
                                        disabled={capped}
                                        onClick={() => toggle(spell)}
                                        onMouseEnter={() => setPreviewSpell(spell)}
                                        className={cn(
                                            "flex cursor-pointer items-center justify-between gap-3 rounded-(--radius-sm) border px-3 py-2 text-left text-sm transition-colors",
                                            selected
                                                ? "border-foreground bg-foreground/10 text-fontcolor"
                                                : "border-transparent text-fontcolor-secondary hover:border-border-strong",
                                            capped && "cursor-not-allowed opacity-40 hover:border-transparent"
                                        )}
                                    >
                                        <span className="flex items-center gap-2">
                                            {selected && <span aria-hidden>✓</span>}
                                            {spell.name}
                                        </span>
                                        <span className="flex shrink-0 gap-2 text-xs">
                                            <Badge variant="muted">{levelLabel(spell.level)}</Badge>
                                            <Badge variant="outline">{spell.school}</Badge>
                                        </span>
                                    </button>
                                );
                            })}
                            {filtered.length === 0 && (
                                <p className="px-3 py-6 text-center text-sm text-fontcolor-secondary">No spells match your search.</p>
                            )}
                        </div>
                        {picked.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {picked.map((name) => {
                                    const spell = options.find((option) => option.name === name);
                                    return (
                                        <button
                                            key={name}
                                            type="button"
                                            className={pillClass(true)}
                                            title="Remove"
                                            onClick={() => (spell ? toggle(spell) : onChange(picked.filter((value) => value !== name)))}
                                        >
                                            {name}
                                            {spell ? ` (${levelLabel(spell.level)})` : ""} &times;
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                    <SpellDetailPanel
                        spell={previewSpell}
                        selected={previewSpell ? isSelected(previewSpell) : false}
                        selectedLabel="Chosen"
                        unselectedLabel="Not chosen"
                        className="lg:sticky lg:top-24"
                    />
                </div>
            )}
        </div>
    );
}
