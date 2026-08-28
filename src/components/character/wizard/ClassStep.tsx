import { CharacterClass } from "@/interfaces/CharacterClass";
import { Subclass } from "@/interfaces/Subclass";
import { Card, CardContent, Select, TextInput } from "@/components/ui";

type ClassStepProps = {
  classes: CharacterClass[];
  subclasses: Subclass[];
  characterClass: CharacterClass | undefined;
  subclass: Subclass | undefined;
  level: number;
  onSelectClass: (characterClass: CharacterClass) => void;
  onSelectSubclass: (subclass: Subclass | undefined) => void;
  onLevelChange: (level: number) => void;
};

export function ClassStep({
  classes,
  subclasses,
  characterClass,
  subclass,
  level,
  onSelectClass,
  onSelectSubclass,
  onLevelChange,
}: ClassStepProps) {
  const eligibleSubclasses = characterClass
    ? subclasses.filter((s) => s.parentClass === characterClass.name)
    : [];
  const subclassUnlocked = Boolean(characterClass && level >= characterClass.subclassLevel);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-fontcolor-secondary">Class</span>
          <Select
            value={characterClass?.name ?? ""}
            onChange={(event) => {
              const next = classes.find((c) => c.name === event.target.value);
              if (next) {
                onSelectClass(next);
                onSelectSubclass(undefined);
              }
            }}
          >
            <option value="" disabled>
              Choose a class...
            </option>
            {classes.map((option) => (
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
            value={level}
            onChange={(event) => {
              const parsed = Number(event.target.value);
              onLevelChange(Number.isFinite(parsed) ? Math.min(20, Math.max(1, parsed)) : 1);
            }}
          />
        </label>
      </div>

      {characterClass && (
        <Card>
          <CardContent className="flex flex-col gap-3 text-sm text-fontcolor-secondary">
            <div className="flex flex-wrap gap-4">
              <span>Hit Die d{characterClass.hitDie}</span>
              <span>Primary: {characterClass.primaryAbility}</span>
              <span>Caster progression: {characterClass.casterProgression}</span>
              <span>Subclass at level {characterClass.subclassLevel}</span>
            </div>
            <p>Armor: {characterClass.proficiencies.armor.join(", ") || "None"}</p>
            <p>Weapons: {characterClass.proficiencies.weapons.join(", ") || "None"}</p>
          </CardContent>
        </Card>
      )}

      {characterClass && (
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-fontcolor-secondary">
            Subclass{" "}
            {!subclassUnlocked && (
              <span className="text-fontcolor-secondary">
                (unlocks at class level {characterClass.subclassLevel})
              </span>
            )}
          </span>
          <Select
            value={subclass?.name ?? ""}
            disabled={!subclassUnlocked || eligibleSubclasses.length === 0}
            onChange={(event) => {
              const next = eligibleSubclasses.find((s) => s.name === event.target.value);
              onSelectSubclass(next);
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
}
