"use client";

import { useMemo, useState } from "react";
import { Spell } from "@/interfaces/Spell";
import { AbilityScores } from "@/interfaces/Characters";
import { DraftClassEntry } from "@/interfaces/CharacterDraft";
import { Badge, Card, CardContent, CardHeader, CardTitle, TextInput } from "@/components/ui";
import { getSpellLimits } from "@/utils/spellcasting";
import { cn } from "@/utils/cn";

type SpellsStepProps = {
  spells: Spell[];
  /** `draft.classes` - every entry contributes to the combined limits below, see utils/spellcasting.ts's getSpellLimits(). */
  classes: DraftClassEntry[];
  /** Final ability scores (race + background bonuses included) - drives the "prepared" casters' ability-modifier-based cap. */
  abilityScores: AbilityScores;
  spellsKnown: Spell[];
  onChange: (spellsKnown: Spell[]) => void;
};

export function levelLabel(level: number): string {
  if (level === 0) return "Cantrip";
  const suffix = level === 1 ? "st" : level === 2 ? "nd" : level === 3 ? "rd" : "th";
  return `${level}${suffix} level`;
}

export function actionLabel(action: string): string {
    return action === "1 action" ? "1 action" : action === "1 bonus action" ? "1 bonus" : action === "1 reaction" ? "1 reaction" : action;
}

function pillClass(selected: boolean): string {
  return cn(
    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
    selected
      ? "border-foreground bg-foreground text-background-darken"
      : "border-border-strong text-fontcolor-secondary hover:border-foreground"
  );
}

function SpellDetailPanel({
  spell,
  selected,
  className,
}: {
  spell: Spell | undefined;
  selected: boolean;
  className?: string;
}) {
  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader>
        <CardTitle>{spell ? spell.name : "Spell details"}</CardTitle>
        {spell && <Badge variant={selected ? "solid" : "muted"}>{selected ? "Known" : "Not known"}</Badge>}
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm text-fontcolor-secondary">
        {!spell && <p>Click a spell to see its full details here.</p>}
        {spell && (
          <>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{levelLabel(spell.level)}</Badge>
              <Badge variant="muted">{spell.school}</Badge>
              {spell.ritual && <Badge variant="muted">Ritual</Badge>}
              {spell.concentration && <Badge variant="muted">Concentration</Badge>}
            </div>
            <p>
              <span className="font-semibold text-fontcolor">Casting time:</span> {spell.castingTime}
            </p>
            <p>
              <span className="font-semibold text-fontcolor">Range:</span> {spell.range}
            </p>
            <p>
              <span className="font-semibold text-fontcolor">Components:</span> {spell.components.join(", ")}
            </p>
            <p>
              <span className="font-semibold text-fontcolor">Duration:</span> {spell.duration}
            </p>
            <p className="whitespace-pre-line">{spell.description}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Lets the player browse the full spell list and pick which ones the
 * character knows/has prepared, filtered down to the spell levels
 * currently available across every class entry, and capped at how many
 * cantrips/leveled spells that combination can know/prepare right now -
 * see utils/spellcasting.ts's getSpellLimits(). Only rendered for
 * spellcasting classes - see ManualWizard's `isSpellcaster`.
 *
 * The spell data has no per-class spell list (spells are edition- AND
 * class-agnostic - see interfaces/Spell.ts's header comment), so this
 * can't narrow the browser down to "spells a Wizard can actually learn"
 * the way a real spellbook restriction would - it only narrows by spell
 * LEVEL and by how many of each the character can know. Documented
 * simplification, same spirit as the other data-shape gaps already
 * flagged around spellcasting.
 *
 * Follows the same "click toggles selection AND drives a detail panel"
 * pattern as SkillsEquipmentStep/ItemDetailPanel, just scoped to spells.
 * Enforcing the caps here is a courtesy, not the only safety net - see
 * utils/characterDraft.ts's `revalidateDraftForClasses`, which prunes
 * `spellsKnown` back down to these same limits whenever the class
 * selection itself changes (e.g. the player goes back and lowers a level
 * or drops a class after already picking spells).
 */
export function SpellsStep({ spells, classes, abilityScores, spellsKnown, onChange }: SpellsStepProps) {
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<number | "all">("all");
  const [actionFilter, setActionFilter] = useState<string | "all">("all");
  const [previewSpell, setPreviewSpell] = useState<Spell | undefined>(spellsKnown[0]);

  const limits = useMemo(() => getSpellLimits(classes, abilityScores), [classes, abilityScores]);
  const availableLevels = limits.availableLevels;
  // Scoped to spells at an available level, same as `availableLevels` itself -
  // otherwise this could offer a casting-time pill (e.g. one only used by a
  // higher-level spell not accessible yet) that filters the browser down to
  // zero results.
  const availableSpellActions = [
    ...new Set(spells.filter((spell) => availableLevels.includes(spell.level)).map((spell) => spell.castingTime)),
  ];

  const cantripsKnown = spellsKnown.filter((spell) => spell.level === 0).length;
  const leveledKnown = spellsKnown.filter((spell) => spell.level > 0).length;
  const atCantripCap = cantripsKnown >= limits.maxCantrips;
  const atLeveledCap = leveledKnown >= limits.maxLeveled;

  const filteredSpells = useMemo(() => {
    const query = search.trim().toLowerCase();
    return spells
      .filter((spell) => availableLevels.includes(spell.level))
      .filter((spell) => levelFilter === "all" || spell.level === levelFilter)
      .filter((spell) => actionFilter === "all" || spell.castingTime === actionFilter)
      .filter((spell) => !query || spell.name.toLowerCase().includes(query))
      .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
  }, [spells, availableLevels, levelFilter, actionFilter, search]);

  function isSelected(spell: Spell): boolean {
    return spellsKnown.some((known) => known.name === spell.name);
  }

  /** A not-yet-known spell the player has no room left for - selectable to preview, but clicking it does nothing (see `toggleSpell`) until something else is removed. */
  function isCapped(spell: Spell): boolean {
    if (isSelected(spell)) return false;
    return spell.level === 0 ? atCantripCap : atLeveledCap;
  }

  function toggleSpell(spell: Spell) {
    setPreviewSpell(spell);
    if (isSelected(spell)) {
      onChange(spellsKnown.filter((known) => known.name !== spell.name));
      return;
    }
    if (isCapped(spell)) return; // at the limit - the pill shows this as disabled, but guard just in case
    onChange([...spellsKnown, spell]);
  }

  if (availableLevels.length === 0) {
    // Shouldn't normally be reachable - ManualWizard only shows this step
    // for spellcasters - but avoids rendering an empty, confusing browser
    // if it ever is (e.g. a level-1 half-caster with no slots yet).
    return (
      <Card>
        <CardContent className="text-sm text-fontcolor-secondary">
          This class combination doesn&apos;t have any spells available yet at this level.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
      <div className="flex flex-col gap-4">
        <Card>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <TextInput
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search spells..."
                className="max-w-xs"
              />
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setLevelFilter("all")} className={pillClass(levelFilter === "all")}>
                  All
                </button>
                {availableLevels.map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setLevelFilter(level)}
                    className={pillClass(levelFilter === level)}
                  >
                    {levelLabel(level)}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setActionFilter("all")} className={pillClass(actionFilter === "all")}>
                  All
                </button>
                {availableSpellActions.map((action) => (
                    <button
                        key={action}
                        type="button"
                        onClick={() => setActionFilter(action)}
                        className={pillClass(actionFilter === action)}
                    >
                      {actionLabel(action)}
                    </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-3 text-xs text-fontcolor-secondary">
              <span className={cn(atCantripCap && "text-fontcolor")}>
                {cantripsKnown}/{limits.maxCantrips} cantrips known
              </span>
              <span className={cn(atLeveledCap && "text-fontcolor")}>
                {leveledKnown}/{limits.maxLeveled} spells known
              </span>
              <span>&middot; {filteredSpells.length} shown</span>
            </div>

            <div className="flex max-h-[28rem] flex-col gap-1 overflow-y-auto pr-1">
              {filteredSpells.map((spell) => {
                const selected = isSelected(spell);
                const capped = isCapped(spell);
                return (
                  <button
                    key={spell.name}
                    type="button"
                    disabled={capped}
                    onClick={() => toggleSpell(spell)}
                    onMouseEnter={() => setPreviewSpell(spell)}
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-(--radius-sm) border px-3 py-2 text-left text-sm transition-colors",
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
              {filteredSpells.length === 0 && (
                <p className="px-3 py-6 text-center text-sm text-fontcolor-secondary">No spells match your search.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {spellsKnown.length > 0 && (
          <Card>
            <CardContent className="flex flex-col gap-3">
              <p className="text-sm font-medium text-fontcolor-secondary">Known spells</p>
              <div className="flex flex-wrap gap-2">
                {[...spellsKnown]
                  .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name))
                  .map((spell) => (
                    <button
                      key={spell.name}
                      type="button"
                      onClick={() => toggleSpell(spell)}
                      className={pillClass(true)}
                      title="Remove"
                    >
                      {spell.name} ({levelLabel(spell.level)}) &times;
                    </button>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <SpellDetailPanel
        spell={previewSpell}
        selected={previewSpell ? isSelected(previewSpell) : false}
        className="lg:sticky lg:top-6"
      />
    </div>
  );
}
