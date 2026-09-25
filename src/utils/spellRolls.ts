import { useEffect, useState } from "react";
import { Spell, SpellDiceRoll, SpellMechanics, SpellRole } from "@/interfaces/Spell";
import { SpellSlots } from "@/interfaces/SpellSlots";
import { CharacterDetails } from "@/interfaces/CharacterDetails";
import {
    DiceRollResult,
    ParsedDice,
    addParsedDice,
    findDiceNotation,
    formatParsedDice,
    parseDiceExpression,
    rollParsedDice,
} from "@/utils/dice";

/** Human-readable role names, in the order the sheet shows them. */
export const SPELL_ROLE_LABELS: Record<SpellRole, string> = {
    damage: "Damage",
    healing: "Healing",
    buff: "Buff",
    debuff: "Debuff",
    control: "Control",
    defense: "Defense",
    summon: "Summon",
    utility: "Utility",
};

/**
 * Tailwind classes for each role's badge colour (used with Badge variant="plain").
 * `primary` is the stronger look for a spell's main role; `secondary` is a
 * fainter version of the same hue for any additional roles.
 * Full class strings are kept literal so Tailwind picks them up.
 */
export const SPELL_ROLE_BADGE_CLASSES: Record<SpellRole, { primary: string; secondary: string }> = {
    damage: {
        primary: "border border-red-400/60 bg-red-500/25 text-red-200",
        secondary: "border border-red-400/30 bg-red-500/10 text-red-300/90",
    },
    healing: {
        primary: "border border-emerald-400/60 bg-emerald-500/25 text-emerald-200",
        secondary: "border border-emerald-400/30 bg-emerald-500/10 text-emerald-300/90",
    },
    buff: {
        primary: "border border-yellow-300/60 bg-yellow-400/20 text-yellow-100",
        secondary: "border border-yellow-300/30 bg-yellow-400/10 text-yellow-200/90",
    },
    debuff: {
        primary: "border border-fuchsia-400/60 bg-fuchsia-500/25 text-fuchsia-200",
        secondary: "border border-fuchsia-400/30 bg-fuchsia-500/10 text-fuchsia-300/90",
    },
    control: {
        primary: "border border-violet-400/60 bg-violet-500/25 text-violet-200",
        secondary: "border border-violet-400/30 bg-violet-500/10 text-violet-300/90",
    },
    defense: {
        primary: "border border-sky-400/60 bg-sky-500/25 text-sky-200",
        secondary: "border border-sky-400/30 bg-sky-500/10 text-sky-300/90",
    },
    summon: {
        primary: "border border-teal-400/60 bg-teal-500/25 text-teal-200",
        secondary: "border border-teal-400/30 bg-teal-500/10 text-teal-300/90",
    },
    utility: {
        primary: "border border-slate-300/50 bg-slate-400/20 text-slate-200",
        secondary: "border border-slate-300/25 bg-slate-400/10 text-slate-300/90",
    },
};

/** Cantrip upgrade tier from total character level: 1 (levels 1-4), 2 (5-10), 3 (11-16), 4 (17+). */
export function cantripTier(characterLevel: number): number {
    if (characterLevel >= 17) return 4;
    if (characterLevel >= 11) return 3;
    if (characterLevel >= 5) return 2;
    return 1;
}

/** Context a roll is scaled for: the slot level it's cast with (ignored for cantrips) and the caster's total character level. */
export type SpellScaleContext = { spellLevel: number; castLevel: number; characterLevel: number };

/** One roll after upcasting / cantrip scaling, ready to display and roll. */
export type ScaledSpellRoll = {
    source: SpellDiceRoll;
    kind: "damage" | "healing" | "effect";
    dice: ParsedDice;
    /** Separate instances (darts, rays, beams) - 1 for a normal roll. */
    instances: number;
    /** "8d6", "3 × (1d4 + 1)", "2d8 + mod" style display string, WITHOUT the spellcasting modifier's numeric value substituted in. */
    display: string;
    /** True when the base dice were modified by upcasting or cantrip scaling (so the UI can highlight the change). */
    scaled: boolean;
};

/** Applies upcast (`castLevel` above the spell's level) and cantrip-tier scaling to one of a spell's dice rolls. Returns null when there's nothing to roll at this level (e.g. Booming Blade's on-hit rider before level 5). */
export function scaleSpellRoll(
    roll: SpellDiceRoll,
    kind: ScaledSpellRoll["kind"],
    { spellLevel, castLevel, characterLevel }: SpellScaleContext
): ScaledSpellRoll | null {
    let dice = parseDiceExpression(roll.dice);
    let instances = roll.count ?? 1;
    let scaled = false;

    if (spellLevel === 0) {
        const extraTiers = cantripTier(characterLevel) - 1;
        if (extraTiers > 0 && roll.cantripDice) {
            dice = addParsedDice(dice, parseDiceExpression(roll.cantripDice), extraTiers);
            scaled = true;
        }
        if (extraTiers > 0 && roll.cantripCount) {
            instances += roll.cantripCount * extraTiers;
            scaled = true;
        }
    } else {
        const levelsAbove = Math.max(0, castLevel - spellLevel);
        const tier = [...(roll.upcastTiers ?? [])]
            .sort((a, b) => b.minLevel - a.minLevel)
            .find((candidate) => castLevel >= candidate.minLevel);
        if (tier) {
            dice = parseDiceExpression(tier.dice);
            scaled = true;
        }
        const steps = Math.floor(levelsAbove / (roll.upcastEvery ?? 1));
        if (steps > 0 && roll.upcastDice) {
            dice = addParsedDice(dice, parseDiceExpression(roll.upcastDice), steps);
            scaled = true;
        }
        if (levelsAbove > 0 && roll.upcastCount) {
            instances += roll.upcastCount * levelsAbove;
            scaled = true;
        }
    }

    const hasDice = dice.groups.length > 0 || dice.flat !== 0;
    if (!hasDice && !roll.addModifier) return null;

    let formula = formatParsedDice(dice);
    if (roll.addModifier) formula = formula ? `${formula} + mod` : "mod";
    const display = instances > 1 ? `${instances} × (${formula})` : formula;

    return { source: roll, kind, dice, instances, display, scaled };
}

/** Every roll a spell offers at the given cast/character level, in damage → healing → effect order. */
export function getScaledSpellRolls(mechanics: SpellMechanics | undefined, context: SpellScaleContext): ScaledSpellRoll[] {
    if (!mechanics) return [];
    const result: ScaledSpellRoll[] = [];
    const push = (rolls: SpellDiceRoll[] | undefined, kind: ScaledSpellRoll["kind"]) => {
        for (const roll of rolls ?? []) {
            const scaled = scaleSpellRoll(roll, kind, context);
            if (scaled) result.push(scaled);
        }
    };
    push(mechanics.damage, "damage");
    push(mechanics.healing, "healing");
    push(mechanics.effects, "effect");
    return result;
}

/** Default button label for a scaled roll: its own label, else "Damage"/"Healing"/"Roll". */
export function scaledRollLabel(roll: ScaledSpellRoll): string {
    if (roll.source.label) return roll.source.label;
    return roll.kind === "damage" ? "Damage" : roll.kind === "healing" ? "Healing" : "Roll";
}

/**
 * Display string for a scaled roll with the spellcasting modifier's actual
 * value folded in ("2d8 + 3", "3 × (1d4 + 1)", "4" for Heroism's flat
 * modifier) - or left as "+ mod" when there's no character to take it from
 * (`abilityModifier === null`, e.g. the compendium search page).
 */
export function formatScaledRoll(roll: ScaledSpellRoll, abilityModifier: number | null): string {
    if (!roll.source.addModifier || abilityModifier === null) return roll.display;
    const formula = formatParsedDice(addParsedDice(roll.dice, { groups: [], flat: abilityModifier })) || "0";
    return roll.instances > 1 ? `${roll.instances} × (${formula})` : formula;
}

/** Rolls a scaled spell roll, adding `abilityModifier` per instance when the roll calls for the spellcasting modifier. */
export function rollScaledSpellRoll(roll: ScaledSpellRoll, abilityModifier: number): DiceRollResult {
    const modifier = roll.source.addModifier ? abilityModifier : 0;
    return rollParsedDice(roll.dice, formatScaledRoll(roll, abilityModifier), modifier, roll.instances);
}

/** Short "how does it scale" hint for the upcast selector, e.g. "+1d6 per slot level" / "+1 dart per slot level" / "3d8 at 3rd+". */
export function describeUpcast(mechanics: SpellMechanics | undefined): string[] {
    if (!mechanics) return [];
    const hints: string[] = [];
    for (const roll of [...(mechanics.damage ?? []), ...(mechanics.healing ?? []), ...(mechanics.effects ?? [])]) {
        const what = roll.label ? ` ${roll.label.toLowerCase()}` : "";
        if (roll.upcastDice) hints.push(`+${roll.upcastDice}${what} per ${roll.upcastEvery === 2 ? "2 slot levels" : "slot level"}`);
        if (roll.upcastCount) hints.push(`+${roll.upcastCount}${what || " roll"} per slot level`);
        if (roll.upcastTiers?.length) hints.push(roll.upcastTiers.map((tier) => `${tier.dice} at ${tier.minLevel}+`).join(", "));
    }
    return hints;
}

/** Whether changing the slot level changes anything about this spell (dice, instance count, or a written upcast note). */
export function spellCanUpcast(spell: Spell, mechanics: SpellMechanics | undefined): boolean {
    if (spell.level === 0) return false;
    if (mechanics) {
        if (mechanics.upcastNote) return true;
        const rolls = [...(mechanics.damage ?? []), ...(mechanics.healing ?? []), ...(mechanics.effects ?? [])];
        return rolls.some((roll) => roll.upcastDice || roll.upcastCount || roll.upcastTiers?.length);
    }
    return /Using a Higher-Level Spell Slot|At Higher Levels/i.test(spell.description);
}

/**
 * Last-resort mechanics for a spell the compendium doesn't know (custom or
 * imported spells with no `mechanics` block, or a name that doesn't match):
 * the first dice notation in the main text, plus - so upcasting still does
 * something - the first "increases by NdM for each (spell) slot level
 * above" in the higher-level text. Role is an honest "damage" when the dice
 * are followed by "damage", else "utility".
 */
export function fallbackMechanics(spell: Spell): SpellMechanics {
    const [main, higher = ""] = spell.description.split(/\n\n(?:Using a Higher-Level Spell Slot|At Higher Levels|Cantrip Upgrade)\.\s*/i);
    const dice = findDiceNotation(main);
    if (!dice) return { roles: ["utility"] };
    const upcast = higher.match(/(\d+d\d+)\s+for\s+(?:each|every)\s+(two\s+)?(?:spell\s+)?slot\s+levels?\s+above/i);
    const cantrip = spell.level === 0 ? spell.description.match(/increases by (\d+d\d+) when you reach/i) : null;
    const isDamage = new RegExp(`${dice.replace(/[+]/g, "\\s*\\+\\s*")}\\s+(?:\\w+\\s+)?damage`, "i").test(main);
    const roll = {
        label: isDamage ? undefined : "Dice in text",
        dice,
        ...(upcast && spell.level > 0 ? { upcastDice: upcast[1], ...(upcast[2] ? { upcastEvery: 2 } : {}) } : {}),
        ...(cantrip ? { cantripDice: cantrip[1] } : {}),
    };
    return isDamage ? { roles: ["damage"], damage: [roll] } : { roles: ["utility"], effects: [roll] };
}

/** Lookup key tolerant of case, curly apostrophes and extra whitespace ("Hunter’s Mark" = "hunter's mark"). */
export function spellNameKey(name: string): string {
    return name.toLowerCase().replace(/[\u2018\u2019`]/g, "'").replace(/\s+/g, " ").trim();
}

// ---------------------------------------------------------------------------
// Compendium lookup
// ---------------------------------------------------------------------------

let compendiumPromise: Promise<Map<string, SpellMechanics>> | null = null;

function loadCompendiumMechanics(): Promise<Map<string, SpellMechanics>> {
    if (!compendiumPromise) {
        compendiumPromise = import("@/data/spells/Spells").then(({ SPELLS }) => {
            const map = new Map<string, SpellMechanics>();
            for (const spell of SPELLS) if (spell.mechanics) map.set(spellNameKey(spell.name), spell.mechanics);
            return map;
        });
    }
    return compendiumPromise;
}

/**
 * Returns a resolver for a spell's mechanics. A character's `spellsKnown`
 * are frozen copies taken when the character was built, so they may predate
 * `mechanics` (or carry an older version of it) - the compendium entry of
 * the same name always wins, then the spell's own copy, then
 * `fallbackMechanics`. The ~0.5 MB spell list is loaded lazily in its own
 * chunk (same one data/index.ts uses) so the sheet doesn't block on it;
 * until it arrives spells render with their own copy.
 */
export function useSpellMechanicsLookup(): (spell: Spell) => SpellMechanics {
    const [compendium, setCompendium] = useState<Map<string, SpellMechanics> | null>(null);

    useEffect(() => {
        let cancelled = false;
        loadCompendiumMechanics()
            .then((map) => {
                if (!cancelled) setCompendium(map);
            })
            .catch(() => undefined);
        return () => {
            cancelled = true;
        };
    }, []);

    return (spell: Spell) => compendium?.get(spellNameKey(spell.name)) ?? spell.mechanics ?? fallbackMechanics(spell);
}

// ---------------------------------------------------------------------------
// Spell slot tracking
// ---------------------------------------------------------------------------

/** Which slot pool a cast draws from. */
export type SlotPool = "spell" | "pact";

/** Slots still available per level: the max from the class tables minus what's recorded as expended. */
export function remainingSlots(max: SpellSlots | null, expended: Record<number, number> | undefined): Record<number, number> {
    const result: Record<number, number> = {};
    if (!max) return result;
    for (const [level, count] of Object.entries(max)) {
        const total = count ?? 0;
        if (total <= 0) continue;
        result[Number(level)] = Math.max(0, total - (expended?.[Number(level)] ?? 0));
    }
    return result;
}

/** `details` patch that expends (delta = 1) or restores (delta = -1) one slot of `level` in `pool`, clamped to 0..max. */
export function adjustExpendedSlots(
    details: CharacterDetails | undefined,
    pool: SlotPool,
    level: number,
    delta: number,
    max: SpellSlots | null
): Partial<CharacterDetails> {
    const key = pool === "pact" ? "expendedPactSlots" : "expendedSpellSlots";
    const current = { ...(details?.[key] ?? {}) };
    const cap = max?.[level] ?? 0;
    current[level] = Math.min(cap, Math.max(0, (current[level] ?? 0) + delta));
    if (current[level] === 0) delete current[level];
    return { [key]: current };
}

/** Slot levels a spell of `spellLevel` could be cast with right now (at least one slot left), across both pools, ascending. */
export function castableLevels(
    spellLevel: number,
    spellSlots: Record<number, number>,
    pactSlots: Record<number, number>
): number[] {
    const levels = new Set<number>();
    for (const [level, count] of [...Object.entries(spellSlots), ...Object.entries(pactSlots)]) {
        if (Number(level) >= spellLevel && count > 0) levels.add(Number(level));
    }
    return [...levels].sort((a, b) => a - b);
}
