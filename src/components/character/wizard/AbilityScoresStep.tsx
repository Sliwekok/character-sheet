import { AbilityScores } from "@/interfaces/Characters";
import { AbilityScoreMethod, AbilityScoreState } from "@/interfaces/CharacterDraft";
import { Race } from "@/interfaces/Race";
import { Background } from "@/interfaces/Background";
import { Badge, Select, TextInput, formatModifier } from "@/components/ui";
import { cn } from "@/utils/cn";
import { abilityScoreStateForMethod } from "@/utils/characterDraft";
import { rollAbilityScoreSet } from "@/utils/dice";
import { sumAbilityScores } from "@/utils/abilityScoreBonuses";
import { calculateAbilityModifiers } from "@/utils/abilityModifiers";
import {
  POINT_BUY_COSTS,
  POINT_BUY_MAX_SCORE,
  POINT_BUY_MIN_SCORE,
  pointBuyRemaining,
} from "@/utils/pointBuy";

type AbilityScoresStepProps = {
  state: AbilityScoreState;
  race: Race;
  background: Background;
  backgroundAbilityBonuses: Partial<AbilityScores>;
  onChange: (next: AbilityScoreState) => void;
  onBackgroundBonusesChange: (next: Partial<AbilityScores>) => void;
};

const ABILITIES: { key: keyof AbilityScores; label: string; short: string }[] = [
  { key: "strength", label: "Strength", short: "STR" },
  { key: "dexterity", label: "Dexterity", short: "DEX" },
  { key: "constitution", label: "Constitution", short: "CON" },
  { key: "intelligence", label: "Intelligence", short: "INT" },
  { key: "wisdom", label: "Wisdom", short: "WIS" },
  { key: "charisma", label: "Charisma", short: "CHA" },
];

const METHODS: { value: AbilityScoreMethod; label: string; description: string }[] = [
  { value: "standard-array", label: "Standard Array", description: "Assign 15/14/13/12/10/8." },
  { value: "point-buy", label: "Point Buy", description: "27-point budget, scores 8-15." },
  { value: "roll", label: "Roll (4d6 drop lowest)", description: "Assign six rolled results." },
  { value: "manual", label: "Manual entry", description: "Type in any six scores." },
];

/**
 * The only wizard step with four genuinely different sub-UIs depending on
 * `state.method` - see interfaces/CharacterDraft.ts's `AbilityScoreState`
 * for why "standard-array" and "roll" share the same pool-assignment
 * mechanic (each is "place these six numbers, one per ability") while
 * "point-buy" and "manual" write straight into `state.scores`.
 *
 * `state.scores` is the BASE score only. This step also owns the
 * background's ability-score bonus allocation (2024 - see
 * `BackgroundBonusPicker` below) and shows a live "final scores" preview -
 * base + race's flat modifiers (2014) + background bonus (2024), via
 * utils/abilityScoreBonuses.ts's `sumAbilityScores()` - since that's what
 * actually gets saved (see utils/characterDraft.ts's `finalizeDraft`).
 */
export function AbilityScoresStep({
  state,
  race,
  background,
  backgroundAbilityBonuses,
  onChange,
  onBackgroundBonusesChange,
}: AbilityScoresStepProps) {
  const usesPool = state.method === "standard-array" || state.method === "roll";

  /** Assigns one pool value to `ability` - removes that value from the pool and, if `ability` already held a different value, returns it to the pool. */
  function assignPoolValue(ability: keyof AbilityScores, rawValue: string) {
    const value = rawValue === "" ? undefined : Number(rawValue);
    const previous = state.scores[ability] || undefined;

    const nextPool = [...state.unassignedPool];
    if (value !== undefined) {
      const idx = nextPool.indexOf(value);
      if (idx !== -1) nextPool.splice(idx, 1);
    }
    if (previous !== undefined) nextPool.push(previous);

    onChange({
      ...state,
      scores: { ...state.scores, [ability]: value ?? 0 },
      unassignedPool: nextPool,
    });
  }

  function adjustPointBuy(ability: keyof AbilityScores, delta: 1 | -1) {
    const current = state.scores[ability];
    const next = current + delta;
    if (next < POINT_BUY_MIN_SCORE || next > POINT_BUY_MAX_SCORE) return;

    const nextScores = { ...state.scores, [ability]: next };
    if (delta === 1 && pointBuyRemaining(nextScores) < 0) return;

    onChange({ ...state, scores: nextScores });
  }

  function setManualScore(ability: keyof AbilityScores, rawValue: string) {
    const parsed = Number(rawValue);
    onChange({ ...state, scores: { ...state.scores, [ability]: Number.isFinite(parsed) ? parsed : 0 } });
  }

  const finalScores = sumAbilityScores(state.scores, race.abilityModifiers, backgroundAbilityBonuses);
  const finalModifiers = calculateAbilityModifiers(finalScores);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {METHODS.map((method) => (
          <button
            key={method.value}
            type="button"
            onClick={() => onChange(abilityScoreStateForMethod(method.value))}
            className={cn(
              "flex flex-col gap-1 rounded-(--radius) border px-4 py-3 text-left transition-colors",
              state.method === method.value
                ? "border-foreground bg-background-elevated/60"
                : "border-border-strong hover:border-foreground"
            )}
          >
            <span className="text-sm font-semibold text-fontcolor">{method.label}</span>
            <span className="text-xs text-fontcolor-secondary">{method.description}</span>
          </button>
        ))}
      </div>

      {state.method === "roll" && (
        <button
          type="button"
          onClick={() => onChange({ method: "roll", scores: state.scores, unassignedPool: rollAbilityScoreSet() })}
          className="w-fit rounded-(--radius) border border-border-strong px-4 py-2 text-sm text-fontcolor hover:border-foreground"
        >
          🎲 Reroll all six
        </button>
      )}

      {state.method === "point-buy" && (
        <p className="text-sm text-fontcolor-secondary">
          Points remaining:{" "}
          <span className={cn("font-semibold", pointBuyRemaining(state.scores) < 0 ? "text-red-400" : "text-fontcolor")}>
            {pointBuyRemaining(state.scores)}
          </span>
        </p>
      )}

      {usesPool && state.unassignedPool.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-fontcolor-secondary">Unassigned:</span>
          {state.unassignedPool.map((value, index) => (
            <Badge key={`${value}-${index}`} variant="muted">
              {value}
            </Badge>
          ))}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {ABILITIES.map(({ key, label }) => (
          <div
            key={key}
            className="flex items-center justify-between gap-3 rounded-(--radius) border border-border bg-background-elevated/40 px-4 py-3"
          >
            <span className="text-sm text-fontcolor-secondary">{label}</span>

            {usesPool && (
              <Select
                className="w-24"
                value={state.scores[key] || ""}
                onChange={(event) => assignPoolValue(key, event.target.value)}
              >
                <option value="">-</option>
                {state.scores[key] > 0 && <option value={state.scores[key]}>{state.scores[key]}</option>}
                {state.unassignedPool.map((value, index) => (
                  <option key={`${value}-${index}`} value={value}>
                    {value}
                  </option>
                ))}
              </Select>
            )}

            {state.method === "point-buy" && (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => adjustPointBuy(key, -1)}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-border-strong text-fontcolor hover:border-foreground"
                  aria-label={`Decrease ${label}`}
                >
                  −
                </button>
                <span className="w-14 text-center font-semibold text-fontcolor">
                  {state.scores[key]}{" "}
                  <span className="text-xs font-normal text-fontcolor-secondary">
                    ({POINT_BUY_COSTS[state.scores[key]] ?? "?"}pt)
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => adjustPointBuy(key, 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-border-strong text-fontcolor hover:border-foreground"
                  aria-label={`Increase ${label}`}
                >
                  +
                </button>
              </div>
            )}

            {state.method === "manual" && (
              <TextInput
                type="number"
                className="w-20"
                value={state.scores[key]}
                onChange={(event) => setManualScore(key, event.target.value)}
              />
            )}
          </div>
        ))}
      </div>

      <BackgroundBonusPicker
        race={race}
        background={background}
        bonuses={backgroundAbilityBonuses}
        onChange={onBackgroundBonusesChange}
      />

      <div className="rounded-(--radius) border border-border-strong bg-background-elevated/40 p-4">
        <p className="mb-3 text-sm font-medium text-fontcolor-secondary">
          Final ability scores (base + race + background)
        </p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
          {ABILITIES.map(({ key, short }) => (
            <div
              key={key}
              className="flex items-center justify-between gap-2 rounded-(--radius-sm) bg-background-darken/60 px-3 py-2"
            >
              <dt className="text-sm text-fontcolor-secondary">{short}</dt>
              <dd className="font-semibold text-fontcolor">
                {finalScores[key]}{" "}
                <span className="text-xs font-normal text-fontcolor-secondary">
                  ({formatModifier(finalModifiers[key])})
                </span>
              </dd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Lets the player allocate a 2024 background's ability score bonus
 * (`background.abilityScoreOptions`) - for a 2014 background (no options
 * at all) it instead just points at the racial modifiers already applied
 * above, since 2014 has nothing here to choose.
 */
function BackgroundBonusPicker({
  race,
  background,
  bonuses,
  onChange,
}: {
  race: Race;
  background: Background;
  bonuses: Partial<AbilityScores>;
  onChange: (next: Partial<AbilityScores>) => void;
}) {
  const options = background.abilityScoreOptions;
  const raceHasModifiers = Object.keys(race.abilityModifiers).length > 0;

  if (!options) {
    return (
      <div className="rounded-(--radius) border border-border bg-background-elevated/20 p-4 text-sm text-fontcolor-secondary">
        {background.name} doesn&apos;t grant an ability score bonus under the 2014 rules.
        {raceHasModifiers ? " Your race's modifiers (already included below) cover that instead." : ""}
      </div>
    );
  }

  function findAbilityWithValue(value: number): keyof AbilityScores | undefined {
    return (Object.entries(bonuses) as [keyof AbilityScores, number][]).find(([, v]) => v === value)?.[0];
  }

  function selectTwoOneAmount(ability: keyof AbilityScores, amount: 1 | 2) {
    const otherAmount = amount === 2 ? 1 : 2;
    const otherAbility = findAbilityWithValue(otherAmount);
    const next: Partial<AbilityScores> = {};
    if (otherAbility && otherAbility !== ability) next[otherAbility] = otherAmount;
    next[ability] = amount;
    onChange(next);
  }

  function toggleOneOfThree(ability: keyof AbilityScores) {
    const isSelected = bonuses[ability] === 1;
    if (isSelected) {
      const next = { ...bonuses };
      delete next[ability];
      onChange(next);
      return;
    }
    const selectedCount = Object.values(bonuses).filter((v) => v === 1).length;
    if (selectedCount >= 3) return;
    onChange({ ...bonuses, [ability]: 1 });
  }

  const isTwoOne = options.allocation === "2-1";
  const selectedCount = Object.keys(bonuses).length;
  const complete = isTwoOne ? selectedCount === 2 : selectedCount === 3;

  return (
    <div className="rounded-(--radius) border border-foreground/40 bg-background-elevated/40 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-fontcolor">{background.name}&apos;s ability score bonus</p>
        <Badge variant={complete ? "solid" : "outline"}>
          {complete ? "Assigned" : isTwoOne ? "Choose +2 and +1" : `Choose 3 (${selectedCount}/3)`}
        </Badge>
      </div>
      <p className="mb-3 text-xs text-fontcolor-secondary">
        {isTwoOne
          ? "Give one of these abilities +2 and a different one +1."
          : "Give three different abilities +1 each."}
      </p>

      <div className="flex flex-col gap-2">
        {options.from.map((ability) => {
          const label = ABILITIES.find((a) => a.key === ability)?.label ?? ability;
          const currentBonus = bonuses[ability];

          return (
            <div
              key={ability}
              className="flex items-center justify-between gap-3 rounded-(--radius-sm) bg-background-darken/60 px-3 py-2"
            >
              <span className="text-sm text-fontcolor-secondary">{label}</span>

              {isTwoOne ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => selectTwoOneAmount(ability, 2)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                      currentBonus === 2
                        ? "border-foreground bg-foreground text-background-darken"
                        : "border-border-strong text-fontcolor-secondary hover:border-foreground"
                    )}
                  >
                    +2
                  </button>
                  <button
                    type="button"
                    onClick={() => selectTwoOneAmount(ability, 1)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                      currentBonus === 1
                        ? "border-foreground bg-foreground text-background-darken"
                        : "border-border-strong text-fontcolor-secondary hover:border-foreground"
                    )}
                  >
                    +1
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => toggleOneOfThree(ability)}
                  disabled={currentBonus !== 1 && selectedCount >= 3}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                    currentBonus === 1
                      ? "border-foreground bg-foreground text-background-darken"
                      : "border-border-strong text-fontcolor-secondary hover:border-foreground disabled:opacity-40"
                  )}
                >
                  +1
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
