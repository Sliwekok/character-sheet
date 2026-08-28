import { Background } from "@/interfaces/Background";
import { Card, CardContent, Select } from "@/components/ui";

type BackgroundStepProps = {
  backgrounds: Background[];
  background: Background | undefined;
  onSelect: (background: Background) => void;
};

export function BackgroundStep({ backgrounds, background, onSelect }: BackgroundStepProps) {
  return (
    <div className="flex flex-col gap-6">
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-fontcolor-secondary">Background</span>
        <Select
          value={background?.name ?? ""}
          onChange={(event) => {
            const next = backgrounds.find((b) => b.name === event.target.value);
            if (next) onSelect(next);
          }}
        >
          <option value="" disabled>
            Choose a background...
          </option>
          {backgrounds.map((option) => (
            <option key={option.name} value={option.name}>
              {option.name}
            </option>
          ))}
        </Select>
      </label>

      {background && (
        <Card>
          <CardContent className="flex flex-col gap-3 text-sm text-fontcolor-secondary">
            <p>Skill proficiencies: {background.skillProficiencies.join(", ")}</p>
            {background.toolProficiency && <p>Tool proficiency: {background.toolProficiency}</p>}
            <p>Equipment: {background.equipment.join(", ")}</p>

            {background.abilityScoreOptions && (
              <p>
                Ability scores: choose from{" "}
                {background.abilityScoreOptions.from.join(", ")} using a{" "}
                {background.abilityScoreOptions.allocation === "2-1" ? "+2/+1" : "+1/+1/+1"} split.
              </p>
            )}
            {background.originFeat && <p>Grants the {background.originFeat} origin feat.</p>}
            {background.feature && (
              <p>
                <span className="font-semibold text-fontcolor">{background.feature.name}:</span>{" "}
                {background.feature.description}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
