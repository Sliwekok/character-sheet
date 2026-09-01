import { Badge } from "@/components/ui";
import { Feat } from "@/interfaces/Feat";

const CATEGORY_LABELS: Record<Feat["category"], string> = {
  origin: "Origin",
  general: "General",
  "fighting-style": "Fighting Style",
  "epic-boon": "Epic Boon",
  dragonmark: "Dragonmark",
  "dark-gift": "Dark Gift",
};

/** One feat on the character sheet: category, prerequisite (if any), ability score increase options (if any), and full description - matching the level of detail WeaponEntry/SpellEntry give other sheet items rather than just the feat's name. */
export function FeatEntry({ feat }: { feat: Feat }) {
  return (
    <div className="rounded-(--radius-sm) bg-background-darken/60 px-3 py-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold text-fontcolor">{feat.name}</span>
        <Badge variant="outline">{CATEGORY_LABELS[feat.category]}</Badge>
        {feat.prerequisite && <Badge variant="muted">Requires {feat.prerequisite}</Badge>}
      </div>
      {feat.abilityScoreIncrease && (
        <p className="mt-1 text-xs text-fontcolor-secondary">
          Ability score increase: +{feat.abilityScoreIncrease.choose} to{" "}
          {feat.abilityScoreIncrease.from.join(", ")}
        </p>
      )}
      <p className="mt-1 whitespace-pre-line text-xs">{feat.description}</p>
    </div>
  );
}
