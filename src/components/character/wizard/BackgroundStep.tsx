import { Background } from "@/interfaces/Background";
import { Card, CardContent, Combobox } from "@/components/ui";

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
        {/*
          Searchable combobox (type to filter, "Select2"-style) instead of a
          native <select>, matching RaceStep - useful once a ruleset's
          background list gets long enough that scrolling a dropdown is
          slower than typing. See components/ui/Combobox.tsx.
        */}
        <Combobox
          options={backgrounds}
          value={background}
          getOptionLabel={(option) => option.name}
          getOptionValue={(option) => option.name}
          onChange={onSelect}
          placeholder="Search backgrounds..."
        />
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
