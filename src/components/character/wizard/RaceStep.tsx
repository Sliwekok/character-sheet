import { Race } from "@/interfaces/Race";
import { Card, CardContent, Select, Badge } from "@/components/ui";

type RaceStepProps = {
  races: Race[];
  race: Race | undefined;
  onSelect: (race: Race) => void;
};

const ABILITY_LABELS: Record<string, string> = {
  strength: "STR",
  dexterity: "DEX",
  constitution: "CON",
  intelligence: "INT",
  wisdom: "WIS",
  charisma: "CHA",
};

export function RaceStep({ races, race, onSelect }: RaceStepProps) {
  return (
    <div className="flex flex-col gap-6">
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-fontcolor-secondary">Race / Species</span>
        <Select
          value={race?.name ?? ""}
          onChange={(event) => {
            const next = races.find((r) => r.name === event.target.value);
            if (next) onSelect(next);
          }}
        >
          <option value="" disabled>
            Choose a race...
          </option>
          {races.map((option) => (
            <option key={option.name} value={option.name}>
              {option.name}
            </option>
          ))}
        </Select>
      </label>

      {race && (
        <Card>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-4 text-sm text-fontcolor-secondary">
              <span>Speed {race.speed} ft.</span>
              {race.languages.length > 0 && <span>Languages: {race.languages.join(", ")}</span>}
            </div>

            {Object.keys(race.abilityModifiers).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {Object.entries(race.abilityModifiers).map(([ability, bonus]) => (
                  <Badge key={ability} variant="solid">
                    {ABILITY_LABELS[ability] ?? ability} {bonus! >= 0 ? `+${bonus}` : bonus}
                  </Badge>
                ))}
              </div>
            )}

            {race.grantedFeatChoice && (
              <p className="text-sm text-fontcolor-secondary">
                Grants a player-chosen {race.grantedFeatChoice.category} feat.
              </p>
            )}
            {race.grantedSkillChoice && (
              <p className="text-sm text-fontcolor-secondary">
                Grants proficiency in {race.grantedSkillChoice.choose} skill(s) of your choice.
              </p>
            )}

            {race.traits.length > 0 && (
              <ul className="flex flex-col gap-1 text-sm text-fontcolor-secondary">
                {race.traits.map((trait) => (
                  <li key={trait}>• {trait}</li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
