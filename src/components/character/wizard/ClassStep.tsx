import { CharacterClass, GrantedSpell } from "@/interfaces/CharacterClass";
import { Subclass } from "@/interfaces/Subclass";
import { HpMethod } from "@/interfaces/Hp";
import { Edition } from "@/interfaces/Edition";
import { DraftClassEntry } from "@/interfaces/CharacterDraft";
import { Badge, Button, Card, CardContent, Combobox, Select, TextInput } from "@/components/ui";
import { rollsNeededForClassEntry } from "@/utils/calculateMaxHp";
import { rollDie } from "@/utils/dice";
import { TextWithSpellMentions } from "@/components/character/SpellMention";
import { decodeFeatureChoiceSelection, encodeFeatureChoiceSelection, getFeatureChoices } from "@/utils/grantedSpells";
import { cn } from "@/utils/cn";
import {JSX} from "react";

type ClassStepProps = {
  classes: CharacterClass[];
  subclasses: Subclass[];
  /** `draft.classes` - entries[0] is the main class (see DraftClassEntry's header comment). */
  entries: DraftClassEntry[];
  onChange: (entries: DraftClassEntry[]) => void;
  /** Needed only to link a decorated spell mention to its own page - see SpellMention.tsx's `spellSearchHref`. */
  edition: Edition;
  /**
   * `draft.featureChoices` - the player's resolved picks for every reached
   * `FeatureChoice` (a Pact Boon, a Fighting Style, a Circle of the Land
   * terrain, a Warlock's Eldritch Invocations, etc.) - see
   * utils/grantedSpells.ts. Each value is a single option id for an
   * ordinary single-select choice, or a comma-joined list of option ids for
   * a multi-select one (`choice.countByLevel` set) - see
   * `decodeFeatureChoiceSelection`/`encodeFeatureChoiceSelection`.
   */
  featureChoices: Record<string, string>;
  onFeatureChoicesChange: (choices: Record<string, string>) => void;
};

function classSummary(characterClass: CharacterClass): string {
  return `d${characterClass.hitDie} hit die · ${characterClass.primaryAbility} · caster: ${characterClass.casterProgression}`;
}

/**
 * Grows/shrinks a class entry's stored rolls to exactly `needed` values -
 * keeping whichever existing rolls are still in range (so leveling up
 * doesn't reroll HP for levels already locked in) and rolling fresh d(hitDie)
 * results for any new ones.
 */
function resizeRolls(hitDie: number, needed: number, existing: number[] | undefined): number[] {
  const current = existing ?? [];
  if (current.length === needed) return current;
  if (current.length > needed) return current.slice(0, needed);
  return [...current, ...Array.from({ length: needed - current.length }, () => rollDie(hitDie))];
}

/** Short badge label for one `GrantedSpell` entry - see FeatureEntry.tsx's `grantedSpellBadgeLabel`, which this mirrors (ClassStep inlines its own feature rendering instead of reusing FeatureEntry - see this file's own header comment). */
function grantedSpellBadgeLabel(grant: GrantedSpell): string {
  if (grant.spellName) return `Free spell: ${grant.spellName}`;
  if (grant.choice) {
    const { count, spellLevel } = grant.choice;
    return `Free spell: choose ${count} level ${spellLevel} spell${count === 1 ? "" : "s"}`;
  }
  return "Free spell";
}

function grantedSpellNames(grantedSpells: GrantedSpell[] | undefined): string[] {
  return (grantedSpells ?? []).map((grant) => grant.spellName).filter((name): name is string => Boolean(name));
}

function classSummaryBlock(characterClass: CharacterClass, edition: Edition): JSX.Element {

  return (
      <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-fontcolor-secondary">
              Features:
          </span>

          {characterClass.features.map((feature, index) => (
              // Keyed by index (plus name/level for readability), not just
              // `feature.name` - several subclasses (e.g. Fighter's Battle
              // Master) repeat a feature name at multiple levels ("Additional
              // Maneuvers" at 7th, 10th, and 15th), so `feature.name` alone
              // collided and React reused/misplaced list nodes across a
              // subclass switch, leaving stale feature lines behind.
              <span className="text-sm font-small text-fontcolor-secondary" key={`${index}-${feature.level}-${feature.name}`}>
                  <b className="text-fontcolor">{feature.name} (level: {feature.level}):</b>{" "}
                  <TextWithSpellMentions text={feature.description} spellNames={grantedSpellNames(feature.grantedSpells)} edition={edition} />
                  {(feature.grantedSpells ?? []).map((grant, grantIndex) => (
                    <Badge key={grantIndex} variant="solid" className="ml-1">
                      {grantedSpellBadgeLabel(grant)}
                    </Badge>
                  ))}
              </span>
          ))}
      </label>
  );
}

function subclassSummary(subclass: Subclass, edition: Edition): JSX.Element {
  return (
      <label className="flex flex-col gap-2">
            <span className="text-sm font-medium">
                Subclass description
            </span>

        <span className="text-sm font-small text-fontcolor-secondary">
                {subclass.description}
            </span>

        <span className="text-sm font-medium">
            Features:
        </span>

        {subclass.features.map((feature, index) => (
            // Keyed by index (plus name/level for readability), not just
            // `feature.name` - several subclasses (e.g. Fighter's Battle
            // Master) repeat a feature name at multiple levels ("Additional
            // Maneuvers" at 7th, 10th, and 15th), so `feature.name` alone
            // collided and React reused/misplaced list nodes across a
            // subclass switch, leaving stale feature lines behind.
            <span className="text-sm font-small text-fontcolor-secondary" key={`${index}-${feature.level}-${feature.name}`}>
                <b className="text-fontcolor">{feature.name}: (level: {feature.level})</b>{" "}
                <TextWithSpellMentions text={feature.description} spellNames={grantedSpellNames(feature.grantedSpells)} edition={edition} />
                {(feature.grantedSpells ?? []).map((grant, grantIndex) => (
                  <Badge key={grantIndex} variant="solid" className="ml-1">
                    {grantedSpellBadgeLabel(grant)}
                  </Badge>
                ))}
            </span>
        ))}
      </label>
  );
}

/**
 * Every class row - the main class (index 0) and any multiclass row added
 * via "Add another class" alike - picks its own class, level, and, once ITS
 * level reaches ITS OWN `subclassLevel`, its own subclass: RAW grants a
 * subclass per class, not once per character, so a Fighter 2/Wizard 3 gets
 * to choose an Arcane Tradition for the Wizard levels even though Fighter
 * was the class the character started in. Each row's class dropdown
 * excludes whatever's already chosen in every OTHER row, so the same class
 * can never be added twice.
 *
 * Spell/skill/equipment consequences of a class change aren't handled
 * here - ManualWizard revalidates the whole draft (utils/characterDraft
 * .ts's `revalidateDraftForClasses`) whenever `entries` changes underneath
 * it, so this component only needs to report the new array.
 */
export function ClassStep({
  classes,
  subclasses,
  entries,
  onChange,
  edition,
  featureChoices,
  onFeatureChoicesChange,
}: ClassStepProps) {
  const primary = entries[0];
  const usedClassNames = new Set(entries.map((entry) => entry.characterClass?.name).filter(Boolean));
  // Every class/subclass FeatureChoice any entry has reached so far (a Pact
  // Boon, a Fighting Style, a Circle of the Land terrain, ...), regardless
  // of whether the player has resolved it yet - see utils/grantedSpells.ts.
  // Filtered per-entry below by `pending.classIndex` when rendered.
  const pendingChoices = getFeatureChoices(entries);

  function setFeatureChoice(key: string, optionId: string) {
    onFeatureChoicesChange({ ...featureChoices, [key]: optionId });
  }

  /** Toggles one option in/out of a multi-select choice's current picks (see `FeatureChoice.countByLevel`), refusing to add a new one once `max` are already selected - the checkbox itself is also disabled in that case (see the render below), this is just the safety net. */
  function toggleFeatureChoiceOption(key: string, optionId: string, max: number) {
    const current = decodeFeatureChoiceSelection(featureChoices[key]);
    const next = current.includes(optionId)
      ? current.filter((id) => id !== optionId)
      : current.length < max
        ? [...current, optionId]
        : current;
    onFeatureChoicesChange({ ...featureChoices, [key]: encodeFeatureChoiceSelection(next) });
  }

  function optionsFor(index: number): CharacterClass[] {
    const ownClassName = entries[index]?.characterClass?.name;
    return classes.filter((option) => option.name === ownClassName || !usedClassNames.has(option.name));
  }

  function updateEntry(index: number, patch: Partial<DraftClassEntry>) {
    onChange(entries.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)));
  }

  function addClass() {
    onChange([...entries, { level: 1, hpMethod: "average" }]);
  }

  function removeClass(index: number) {
    onChange(entries.filter((_, i) => i !== index));
  }

  /** Switches a class entry's HP method - rolling a fresh set of dice immediately when switching TO "roll", so there's always something to show (and reroll) right away. */
  function setHpMethod(index: number, hpMethod: HpMethod) {
    const entry = entries[index];
    const needed = entry.characterClass ? rollsNeededForClassEntry(entry.level, index === 0) : 0;
    const hpRolls =
      hpMethod === "roll" && entry.characterClass
        ? Array.from({ length: needed }, () => rollDie(entry.characterClass!.hitDie))
        : entry.hpRolls;
    updateEntry(index, { hpMethod, hpRolls });
  }

  /** Re-rolls every non-first-level HP roll for one class entry from scratch. */
  function rerollHp(index: number) {
    const entry = entries[index];
    if (!entry.characterClass) return;
    const needed = rollsNeededForClassEntry(entry.level, index === 0);
    updateEntry(index, {
      hpRolls: Array.from({ length: needed }, () => rollDie(entry.characterClass!.hitDie)),
    });
  }

  /** Subclasses belonging to one entry's own class - every entry picks from its own class's list, not just the main class's. */
  function eligibleSubclassesFor(entry: DraftClassEntry): Subclass[] {
    return entry.characterClass ? subclasses.filter((s) => s.parentClass === entry.characterClass!.name) : [];
  }

  /** Whether one entry's OWN level has reached its OWN class's `subclassLevel` - checked per entry, so a secondary (multiclass) class unlocks its subclass picker independently of the main class's level. */
  function isSubclassUnlocked(entry: DraftClassEntry): boolean {
    return Boolean(entry.characterClass && entry.level >= entry.characterClass.subclassLevel);
  }

  const canAddClass = Boolean(primary?.characterClass) && entries.length < classes.length;

  return (
    <div className="flex flex-col gap-6">
      {entries.map((entry, index) => {
        const isPrimary = index === 0;
        const options = optionsFor(index);

        return (
          <div key={index} className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-[2fr_1fr_1fr_auto]">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-fontcolor-secondary">
                  {isPrimary ? "Class" : `Class ${index + 1} (multiclass)`}
                </span>
                <Select
                  value={entry.characterClass?.name ?? ""}
                  onChange={(event) => {
                    const next = options.find((c) => c.name === event.target.value);
                    if (next) {
                      updateEntry(index, {
                        characterClass: next,
                        // A new class choice invalidates whatever subclass
                        // was picked for the old one - the same subclass
                        // list, and often the same subclassLevel, doesn't
                        // carry over to an unrelated class.
                        subclass: undefined,
                        // A different class means a different (or same) hit
                        // die - previously-rolled values no longer mean
                        // anything against it, so reroll fresh rather than
                        // carry stale numbers forward.
                        hpRolls:
                          entry.hpMethod === "roll"
                            ? Array.from({ length: rollsNeededForClassEntry(entry.level, isPrimary) }, () =>
                                rollDie(next.hitDie)
                              )
                            : entry.hpRolls,
                      });
                    }
                  }}
                >
                  <option value="" disabled>
                    Choose a class...
                  </option>
                  {options.map((option) => (
                    <option key={option.name} value={option.name}>
                      {option.name}
                    </option>
                  ))}
                </Select>
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-fontcolor-secondary">Level</span>
                <TextInput
                  type="number"
                  min={1}
                  max={20}
                  value={entry.level}
                  onChange={(event) => {
                    const parsed = Number(event.target.value);
                    const level = Number.isFinite(parsed) ? Math.min(20, Math.max(1, parsed)) : 1;
                    const hpRolls =
                      entry.hpMethod === "roll" && entry.characterClass
                        ? resizeRolls(
                            entry.characterClass.hitDie,
                            rollsNeededForClassEntry(level, isPrimary),
                            entry.hpRolls
                          )
                        : entry.hpRolls;
                    updateEntry(index, { level, hpRolls });
                  }}
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-fontcolor-secondary">Hit points</span>
                <Select
                  value={entry.hpMethod ?? "average"}
                  onChange={(event) => setHpMethod(index, event.target.value as HpMethod)}
                >
                  <option value="average">Average (fixed)</option>
                  <option value="roll">Roll each level</option>
                </Select>
              </label>

              {!isPrimary && (
                <div className="flex items-end">
                  <Button variant="secondary" size="md" onClick={() => removeClass(index)}>
                    Remove
                  </Button>
                </div>
              )}
            </div>

            {entry.characterClass && entry.hpMethod === "roll" && (
              <div className="flex flex-wrap items-center gap-3 text-xs text-fontcolor-secondary">
                <span>
                  Rolled (d{entry.characterClass.hitDie} each, level {isPrimary ? "2" : "1"}+):{" "}
                  {(entry.hpRolls ?? []).length > 0 ? entry.hpRolls!.join(", ") : "—"}
                </span>
                <Button variant="secondary" size="sm" onClick={() => rerollHp(index)}>
                  Reroll
                </Button>
              </div>
            )}

            {isPrimary && entry.characterClass && (
              <Card>
                <CardContent className="flex flex-col gap-3 text-sm text-fontcolor-secondary">
                  <div className="flex flex-wrap gap-4">
                    <span>Hit Die d{entry.characterClass.hitDie}</span>
                    <span>Primary: {entry.characterClass.primaryAbility}</span>
                    <span>Caster progression: {entry.characterClass.casterProgression}</span>
                    <span>Subclass at level {entry.characterClass.subclassLevel}</span>
                  </div>
                  <p>Armor: {entry.characterClass.proficiencies.armor.join(", ") || "None"}</p>
                  <p>Weapons: {entry.characterClass.proficiencies.weapons.join(", ") || "None"}</p>
                </CardContent>
              </Card>
            )}

            {!isPrimary && entry.characterClass && (
              <p className="text-xs text-fontcolor-secondary">{classSummary(entry.characterClass)}</p>
            )}

            {isPrimary && entry.characterClass && (
                <p className="text-xs text-fontcolor-secondary">{classSummaryBlock(entry.characterClass, edition)}</p>
            )}

            {entry.characterClass && (() => {
              const characterClass = entry.characterClass!;
              const eligibleSubclasses = eligibleSubclassesFor(entry);
              const subclassUnlocked = isSubclassUnlocked(entry);
              return (
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-fontcolor-secondary">
                    {isPrimary ? "Subclass" : `Subclass (${characterClass.name})`}{" "}
                    {!subclassUnlocked && (
                      <span className="text-fontcolor-secondary">
                        (unlocks at {characterClass.name} level {characterClass.subclassLevel})
                      </span>
                    )}
                  </span>
                  <Combobox
                    options={eligibleSubclasses}
                    value={entry.subclass}
                    getOptionLabel={(option) => option.name}
                    getOptionValue={(option) => option.name}
                    isDisabled={!subclassUnlocked || eligibleSubclasses.length === 0}
                    onChange={(next) => updateEntry(index, { subclass: next })}
                    onClear={() => updateEntry(index, { subclass: undefined })}
                    placeholder={eligibleSubclasses.length === 0 ? "No subclasses available" : "Search subclasses..."}
                  />
                  {entry.subclass && subclassSummary(entry.subclass, edition)}
                </label>
              );
            })()}

            {pendingChoices
              .filter((pending) => pending.classIndex === index)
              .map((pending) => {
                // A multi-select choice (e.g. Eldritch Invocations) is
                // rendered as a capped checkbox list instead of the
                // single-option `<Select>` every other `FeatureChoice`
                // still uses - `choice.countByLevel` being set is what
                // marks a choice as multi-select even at a level where it
                // currently only allows one pick (e.g. a 2024 Warlock's
                // first invocation slot), so the control doesn't change
                // shape out from under the player as they level up.
                if (pending.choice.countByLevel) {
                  const selectedIds = decodeFeatureChoiceSelection(featureChoices[pending.key]);
                  return (
                    <label key={pending.key} className="flex flex-col gap-2">
                      <span className="text-sm font-medium text-fontcolor-secondary">
                        {pending.featureName} — {pending.choice.prompt} ({selectedIds.length}/{pending.maxSelections}
                        ){" "}
                        <span className="text-red-500" title="Required before you can continue">*</span>
                      </span>
                      <div className="flex max-h-72 flex-col gap-1 overflow-y-auto rounded-(--radius-sm) border border-border-strong p-2">
                        {pending.choice.options.map((option) => {
                          const checked = selectedIds.includes(option.id);
                          const disabled = !checked && selectedIds.length >= pending.maxSelections;
                          return (
                            <label
                              key={option.id}
                              className={cn(
                                "flex items-start gap-2 text-sm",
                                disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                              )}
                            >
                              <input
                                type="checkbox"
                                className="mt-1"
                                checked={checked}
                                disabled={disabled}
                                onChange={() => toggleFeatureChoiceOption(pending.key, option.id, pending.maxSelections)}
                              />
                              <span>
                                <span className="font-medium text-fontcolor">{option.label}</span>
                                {option.summary && (
                                  <span className="text-fontcolor-secondary"> — {option.summary}</span>
                                )}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </label>
                  );
                }

                const chosenId = featureChoices[pending.key];
                const chosenOption = pending.choice.options.find((option) => option.id === chosenId);
                return (
                  <label key={pending.key} className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-fontcolor-secondary">
                      {pending.featureName} — {pending.choice.prompt}{" "}
                      <span className="text-red-500" title="Required before you can continue">*</span>
                    </span>
                    <Select
                      value={chosenId ?? ""}
                      onChange={(event) => setFeatureChoice(pending.key, event.target.value)}
                    >
                      <option value="" disabled>
                        Choose... (required)
                      </option>
                      {pending.choice.options.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                    {chosenOption?.summary && (
                      <p className="text-xs text-fontcolor-secondary">{chosenOption.summary}</p>
                    )}
                  </label>
                );
              })}
          </div>
        );
      })}

      <div>
        <Button variant="secondary" onClick={addClass} disabled={!canAddClass}>
          Add another class (multiclass)
        </Button>
        {!primary?.characterClass && (
          <p className="mt-2 text-xs text-fontcolor-secondary">Choose your main class first.</p>
        )}
      </div>
    </div>
  );
}
