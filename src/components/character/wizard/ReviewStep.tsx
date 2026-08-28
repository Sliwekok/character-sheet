import { ReactNode } from "react";
import { CharacterDraft } from "@/interfaces/CharacterDraft";
import { Badge, Button, Card, CardContent, StatBlock, formatModifier } from "@/components/ui";
import { finalizeDraft, isDraftReadyToFinalize } from "@/utils/characterDraft";
import { calculateAbilityModifiers } from "@/utils/abilityModifiers";
import { calculateArmorClass } from "@/utils/calculateArmorClass";

type ReviewStepProps = {
  draft: CharacterDraft;
  isEditing: boolean;
  onSave: () => void;
  /** Extra controls rendered next to Save - e.g. the random flow's "Reroll" button. */
  extraActions?: ReactNode;
};

export function ReviewStep({ draft, isEditing, onSave, extraActions }: ReviewStepProps) {
  const ready = isDraftReadyToFinalize(draft);
  const preview = ready ? finalizeDraft(draft) : null;

  if (!ready || !preview) {
    return (
      <Card>
        <CardContent className="text-sm text-fontcolor-secondary">
          A few required steps aren&apos;t finished yet — go back and fill in edition, race,
          class, background, ability scores (including the background&apos;s ability score
          bonus, for a 2024 character), name, and alignment before reviewing.
        </CardContent>
      </Card>
    );
  }

  const modifiers = calculateAbilityModifiers(preview.abilityScores);
  const ac = calculateArmorClass(preview);
  const classSummary = preview.classes
    .map((entry) => `${entry.class.name}${entry.subclass ? ` (${entry.subclass.name})` : ""} ${entry.level}`)
    .join(", ");

  const stats = [
    { label: "STR", value: formatModifier(modifiers.strength) },
    { label: "DEX", value: formatModifier(modifiers.dexterity) },
    { label: "CON", value: formatModifier(modifiers.constitution) },
    { label: "INT", value: formatModifier(modifiers.intelligence) },
    { label: "WIS", value: formatModifier(modifiers.wisdom) },
    { label: "CHA", value: formatModifier(modifiers.charisma) },
  ];

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-2xl tracking-wide text-fontcolor">{preview.name}</h3>
              <p className="text-sm text-fontcolor-secondary">
                {preview.race.name} {classSummary} · {preview.edition} rules
              </p>
            </div>
            <Badge variant="outline">{preview.alignment}</Badge>
          </div>

          <div className="flex flex-wrap gap-3">
            <Badge variant="solid">AC {ac}</Badge>
            <Badge variant="muted">HP {preview.maxHP}</Badge>
            <Badge variant="muted">Initiative {formatModifier(preview.initiative)}</Badge>
          </div>

          <StatBlock stats={stats} />

          <div className="grid gap-2 text-sm text-fontcolor-secondary sm:grid-cols-2">
            <p>Background: {preview.background.name}</p>
            {preview.backgroundAbilityBonuses && (
              <p>
                Background bonus:{" "}
                {Object.entries(preview.backgroundAbilityBonuses)
                  .map(([ability, bonus]) => `${ability} +${bonus}`)
                  .join(", ")}
              </p>
            )}
            <p>Skills: {preview.skillProficiencies.join(", ") || "None"}</p>
            <p>Armor: {preview.equippedArmor?.name ?? "Unarmored"}{preview.shield ? ` + ${preview.shield.name}` : ""}</p>
            <p>Weapons: {preview.weapons.map((w) => w.name).join(", ") || "None"}</p>
            <p>Languages: {preview.languages.join(", ") || "None"}</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={onSave}>{isEditing ? "Save changes" : "Save character"}</Button>
        {extraActions}
      </div>
    </div>
  );
}
