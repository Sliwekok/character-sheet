import { Badge } from "@/components/ui";
import { cn } from "@/utils/cn";
import { GrantedSpell } from "@/interfaces/CharacterClass";
import { Edition } from "@/interfaces/Edition";
import { TextWithSpellMentions } from "@/components/character/SpellMention";

export type FeatureLike = {
  name: string;
  level: number;
  description: string;
  grantedSpells?: GrantedSpell[];
  /** Level threshold -> number of d6s (see `ClassFeature.sneakAttackDice`). When present, a progression table is shown beside the description. */
  sneakAttackDice?: Record<number, number>;
};

/**
 * Turns a `sneakAttackDice` threshold map ({ 1: 1, 3: 2, ... }) into level
 * ranges ("1–2" -> 1d6, "3–4" -> 2d6, ... "19–20" -> 10d6) and highlights
 * the row covering `classLevel`, if given. The compendium search page has no
 * character, so it omits `classLevel` and just gets the plain table.
 */
function SneakAttackTable({ dice, classLevel }: { dice: Record<number, number>; classLevel?: number }) {
  const thresholds = Object.keys(dice)
    .map(Number)
    .sort((a, b) => a - b);
  const rows = thresholds.map((from, index) => {
    const to = (thresholds[index + 1] ?? 21) - 1;
    return { from, to, value: `${dice[from]}d6`, current: classLevel !== undefined && classLevel >= from && classLevel <= to };
  });

  return (
    <table className="w-full shrink-0 border-collapse text-xs tabular-nums sm:w-40">
      <thead>
        <tr className="text-[11px] uppercase tracking-wide text-fontcolor-secondary">
          <th className="px-2 py-1 text-left font-semibold">Level</th>
          <th className="px-2 py-1 text-right font-semibold">Damage</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr
            key={row.from}
            aria-current={row.current ? "true" : undefined}
            className={cn(
              "border-t border-border-strong/40",
              row.current && "bg-foreground/25 font-semibold text-foreground outline outline-1 outline-foreground-hover/60"
            )}
          >
            <td className="px-2 py-0.5">
              {row.from === row.to ? row.from : `${row.from}–${row.to}`}
              {row.current && <span className="ml-1 text-[10px] uppercase tracking-wide"></span>}
            </td>
            <td className="px-2 py-0.5 text-right">{row.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * Short badge label for one of a feature's `grantedSpells` entries - see
 * GrantedSpell's header comment (interfaces/CharacterClass.ts) for what
 * qualifies. A fixed-name grant (the common case) is called out by name;
 * a choice-type grant (e.g. Mystic Arcanum) instead just says how many
 * spells of what level, since there's no fixed name to show. One badge per
 * entry, since a single feature occasionally grants more than one spell
 * (e.g. Phantasmal Creatures).
 */
function grantedSpellBadgeLabel(grant: GrantedSpell): string {
  if (grant.spellName) return `Free spell: ${grant.spellName}`;
  if (grant.choice) {
    const { count, spellLevel } = grant.choice;
    return `Free spell: choose ${count} level ${spellLevel} spell${count === 1 ? "" : "s"}`;
  }
  return "Free spell";
}

/**
 * One class or subclass feature on the character sheet - name, the level
 * it's gained at, and its full description. Used for both `CharacterClass.
 * features` (base class features) and `Subclass.features`, which share the
 * exact same shape (see interfaces/CharacterClass.ts and
 * interfaces/Subclass.ts).
 *
 * Unlike WeaponEntry/SpellEntry, this always renders every feature the
 * class/subclass will EVER grant, not just the ones already unlocked - a
 * feature whose `level` is higher than the character's current level in
 * that class renders dimmed with a "Locked" badge instead of being left
 * out, so the player can see what's still ahead of them.
 *
 * When `feature.grantedSpells` names a fixed spell, that name is decorated
 * inline wherever it's mentioned in `feature.description` (see
 * TextWithSpellMentions) and linked through to that spell's own page, and
 * a "Free spell" badge calls the grant out even for someone skimming past
 * the full description text - see `grantedSpellBadgeLabel` above. `edition`
 * is needed only to build that link (the same `/search?edition=...` route
 * used elsewhere - see SpellMention.tsx's `spellSearchHref`).
 *
 * By default the description sits behind a click-to-expand `<details>`
 * disclosure, same as every other feature on the sheet. Pass
 * `alwaysExpanded` (used by the compendium search result page, where
 * there's exactly one class/subclass to read through and no reason to make
 * the player click every feature open) to skip that entirely - no
 * disclosure triangle, no toggle, description just shown.
 */
export function FeatureEntry({
  feature,
  reached,
  edition,
  alwaysExpanded = false,
  classLevel,
}: {
  feature: FeatureLike;
  reached: boolean;
  edition: Edition;
  alwaysExpanded?: boolean;
  /** The character's level in this feature's class - used to highlight the current row of a progression table (e.g. Sneak Attack). */
  classLevel?: number;
}) {
  const grantedSpells = feature.grantedSpells ?? [];
  const spellNames = grantedSpells
    .map((grant) => grant.spellName)
    .filter((name): name is string => Boolean(name));

  const headerContent = (
    <>
      <span className="font-semibold text-fontcolor cursor-pointer">{feature.name}</span>
      <Badge variant="muted">Level {feature.level}</Badge>
      {!reached && <Badge variant="outline">Locked</Badge>}
      {reached &&
          grantedSpells.map((grant, index) => (
              <Badge key={index} variant="solid">
                {grantedSpellBadgeLabel(grant)}
              </Badge>
          ))}
    </>
  );

  const descriptionText = (
    <TextWithSpellMentions
        text={feature.description}
        spellNames={spellNames}
        edition={edition}
    />
  );

  const description = feature.sneakAttackDice ? (
    <div className="basis-full mt-1 flex flex-col gap-3 sm:flex-row sm:items-start">
      <div className="flex-1 leading-4 whitespace-pre-line text-xs">{descriptionText}</div>
      <SneakAttackTable dice={feature.sneakAttackDice} classLevel={classLevel} />
    </div>
  ) : (
    <div className="basis-full leading-4 mt-1 whitespace-pre-line text-xs">{descriptionText}</div>
  );

  return (
    <div className={cn("rounded-(--radius-sm) bg-background-darken/60 px-3 py-2", !reached && "opacity-60")}>
      {alwaysExpanded ? (
        <div className="flex flex-wrap items-center gap-2">
          <div className="font-semibold text-fontcolor w-full flex flex-wrap items-center gap-2">
            {headerContent}
          </div>
          {description}
        </div>
      ) : (
        <details className="flex flex-wrap items-center gap-2">
          <summary className="font-semibold text-fontcolor w-full">{headerContent}</summary>
          {description}
        </details>
      )}
    </div>
  );
}
