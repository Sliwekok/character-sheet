import { CharacterClass } from "@/interfaces/CharacterClass";
import { Subclass } from "@/interfaces/Subclass";
import { DraftClassEntry } from "@/interfaces/CharacterDraft";
import { Button, Card, CardContent, Select, TextInput } from "@/components/ui";

type ClassStepProps = {
  classes: CharacterClass[];
  subclasses: Subclass[];
  /** `draft.classes` - entries[0] is the main class (see DraftClassEntry's header comment). */
  entries: DraftClassEntry[];
  onChange: (entries: DraftClassEntry[]) => void;
};

function classSummary(characterClass: CharacterClass): string {
  return `d${characterClass.hitDie} hit die · ${characterClass.primaryAbility} · caster: ${characterClass.casterProgression}`;
}

/**
 * The main class row (index 0) picks class, level, and - once its level
 * reaches `subclassLevel` - a subclass. Every additional row (added via
 * "Add another class", i.e. multiclassing) only picks a class and level:
 * RAW gives a character exactly one subclass, always on the class they
 * took it in, and this wizard always treats that as the main class - see
 * DraftClassEntry's header comment. Each row's class dropdown excludes
 * whatever's already chosen in every OTHER row, so the same class can
 * never be added twice.
 *
 * Spell/skill/equipment consequences of a class change aren't handled
 * here - ManualWizard revalidates the whole draft (utils/characterDraft
 * .ts's `revalidateDraftForClasses`) whenever `entries` changes underneath
 * it, so this component only needs to report the new array.
 */
export function ClassStep({ classes, subclasses, entries, onChange }: ClassStepProps) {
  const primary = entries[0];
  const usedClassNames = new Set(entries.map((entry) => entry.characterClass?.name).filter(Boolean));

  function optionsFor(index: number): CharacterClass[] {
    const ownClassName = entries[index]?.characterClass?.name;
    return classes.filter((option) => option.name === ownClassName || !usedClassNames.has(option.name));
  }

  function updateEntry(index: number, patch: Partial<DraftClassEntry>) {
    onChange(entries.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)));
  }

  function addClass() {
    onChange([...entries, { level: 1 }]);
  }

  function removeClass(index: number) {
    onChange(entries.filter((_, i) => i !== index));
  }

  const eligibleSubclasses = primary?.characterClass
    ? subclasses.filter((s) => s.parentClass === primary.characterClass!.name)
    : [];
  const subclassUnlocked = Boolean(primary?.characterClass && primary.level >= primary.characterClass.subclassLevel);
  const canAddClass = Boolean(primary?.characterClass) && entries.length < classes.length;

  return (
    <div className="flex flex-col gap-6">
      {entries.map((entry, index) => {
        const isPrimary = index === 0;
        const options = optionsFor(index);

        return (
          <div key={index} className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-[2fr_1fr_auto]">
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
                        // was picked for the old one, same as the original
                        // (single-class) behavior.
                        subclass: isPrimary ? undefined : entry.subclass,
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
                    updateEntry(index, { level: Number.isFinite(parsed) ? Math.min(20, Math.max(1, parsed)) : 1 });
                  }}
                />
              </label>

              {!isPrimary && (
                <div className="flex items-end">
                  <Button variant="secondary" size="md" onClick={() => removeClass(index)}>
                    Remove
                  </Button>
                </div>
              )}
            </div>

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
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-fontcolor-secondary">
                  Subclass{" "}
                  {!subclassUnlocked && (
                    <span className="text-fontcolor-secondary">
                      (unlocks at class level {entry.characterClass.subclassLevel})
                    </span>
                  )}
                </span>
                <Select
                  value={entry.subclass?.name ?? ""}
                  disabled={!subclassUnlocked || eligibleSubclasses.length === 0}
                  onChange={(event) => {
                    const next = eligibleSubclasses.find((s) => s.name === event.target.value);
                    updateEntry(index, { subclass: next });
                  }}
                >
                  <option value="">
                    {eligibleSubclasses.length === 0 ? "No subclasses available" : "None chosen yet"}
                  </option>
                  {eligibleSubclasses.map((option) => (
                    <option key={option.name} value={option.name}>
                      {option.name}
                    </option>
                  ))}
                </Select>
              </label>
            )}
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
