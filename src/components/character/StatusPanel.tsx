"use client";

import { Character } from "@/interfaces/Characters";
import { CharacterDetails, DeathSaves } from "@/interfaces/CharacterDetails";
import { ConditionName } from "@/interfaces/Condition";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Tooltip } from "@/components/ui";
import { cn } from "@/utils/cn";
import { CONDITIONS, CONDITION_DESCRIPTIONS, MAX_EXHAUSTION_LEVEL, getExhaustionEffectLines } from "@/utils/conditions";

/**
 * One click-to-fill pip, used by `PipRow` below for both the Death Saves
 * rows and the exhaustion track. A plain circular button rather than a
 * checkbox, since a pip's "on" state is positional (pip 3 only makes sense
 * filled if 1 and 2 are too) rather than independently toggled.
 */
function Pip({ filled, onClick, label }: { filled: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={filled}
      className={cn(
        "h-4 w-4 shrink-0 rounded-full border transition-colors",
        filled ? "border-foreground-hover bg-foreground" : "border-border-strong hover:border-foreground/60"
      )}
    />
  );
}

/**
 * A row of `count` click-to-fill pips sharing one `value` (how many are
 * currently filled, left to right). Clicking pip `index` sets the value to
 * `index + 1`, except clicking the current topmost filled pip again clears
 * back down to `index` - the same "click to raise, click the edge pip again
 * to lower" interaction already used for HP/spell-slot-style pips
 * elsewhere, just made interactive here for the first time.
 */
function PipRow({
  count,
  value,
  onChange,
  label,
}: {
  count: number;
  value: number;
  onChange: (next: number) => void;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: count }).map((_, index) => (
        <Pip
          key={index}
          label={`${label} ${index + 1}`}
          filled={index < value}
          onClick={() => onChange(value === index + 1 ? index : index + 1)}
        />
      ))}
    </div>
  );
}

/**
 * In-play status tracking: inspiration, exhaustion, concentration, death
 * saves, and active conditions. Unlike the rest of `CharacterDetails` (all
 * static flavor text edited through the wizard), every control here writes
 * straight back through `onUpdateDetails` and persists immediately - the
 * same "click it, it's saved" pattern `WeaponEntry`'s mastery checkbox
 * already established - so this card is meant to be used live at the table,
 * not just filled in once during character creation.
 *
 * None of this is mechanically enforced elsewhere in the app (see
 * CharacterDetails.ts's header comment) - a Tooltip next to each control
 * explains what it actually does per the rules so the player can apply it
 * themselves, same spirit as the AC/HP breakdown tooltips throughout the
 * rest of the sheet.
 */
export function StatusPanel({
  character,
  onUpdateDetails,
}: {
  character: Character;
  onUpdateDetails: (patch: Partial<CharacterDetails>) => void;
}) {
  const details = character.details;
  const deathSaves: DeathSaves = details?.deathSaves ?? { successes: 0, failures: 0 };
  const exhaustionLevel = details?.exhaustionLevel ?? 0;
  const conditions = details?.conditions ?? [];
  const concentratingOn = details?.concentratingOn;
  const stable = deathSaves.successes === 0 && deathSaves.failures === 0;

  function toggleCondition(condition: ConditionName) {
    const next = conditions.includes(condition)
      ? conditions.filter((c) => c !== condition)
      : [...conditions, condition];
    onUpdateDetails({ conditions: next });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 text-sm text-fontcolor-secondary">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={Boolean(details?.inspiration)}
              onChange={(event) => onUpdateDetails({ inspiration: event.target.checked })}
              className="h-4 w-4 accent-foreground"
            />
            Inspiration
          </label>

          <div className="flex items-center gap-2">
            <span>Exhaustion</span>
            <PipRow
              count={MAX_EXHAUSTION_LEVEL}
              value={exhaustionLevel}
              label="Exhaustion level"
              onChange={(next) => onUpdateDetails({ exhaustionLevel: next })}
            />
            <Tooltip title={`Exhaustion ${exhaustionLevel}`}>
              <ul className="list-disc pl-4">
                {getExhaustionEffectLines(exhaustionLevel, character.edition).map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </Tooltip>
          </div>

          <div className="flex items-center gap-2">
            <span>Concentration</span>
            {concentratingOn ? (
              <Badge variant="solid">
                {concentratingOn}
                <button
                  type="button"
                  onClick={() => onUpdateDetails({ concentratingOn: undefined })}
                  aria-label="Stop concentrating"
                  className="ml-1 leading-none opacity-80 hover:opacity-100"
                >
                  ✕
                </button>
              </Badge>
            ) : (
              <Badge variant="muted">None</Badge>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border pt-3">
          <span>Death saves</span>
          <span className="flex items-center gap-1.5">
            <span className="text-xs">Successes</span>
            <PipRow
              count={3}
              value={deathSaves.successes}
              label="Death save success"
              onChange={(next) => onUpdateDetails({ deathSaves: { ...deathSaves, successes: next } })}
            />
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-xs">Failures</span>
            <PipRow
              count={3}
              value={deathSaves.failures}
              label="Death save failure"
              onChange={(next) => onUpdateDetails({ deathSaves: { ...deathSaves, failures: next } })}
            />
          </span>
          {!stable && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onUpdateDetails({ deathSaves: { successes: 0, failures: 0 } })}
            >
              Clear
            </Button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
          {CONDITIONS.map((condition) => {
            const active = conditions.includes(condition);
            return (
              <span key={condition} className="inline-flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => toggleCondition(condition)}
                  aria-pressed={active}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide transition-colors",
                    active
                      ? "border-foreground-hover/60 bg-foreground/25 text-foreground hover:bg-foreground/40"
                      : "border-border-strong text-fontcolor-secondary hover:border-foreground/50 hover:text-foreground"
                  )}
                >
                  {condition}
                </button>
                <Tooltip title={condition}>
                  <p>{CONDITION_DESCRIPTIONS[condition]}</p>
                </Tooltip>
              </span>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
