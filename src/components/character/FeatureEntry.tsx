import { Badge } from "@/components/ui";
import { cn } from "@/utils/cn";
import { GrantedSpell } from "@/interfaces/CharacterClass";
import { Edition } from "@/interfaces/Edition";
import { TextWithSpellMentions } from "@/components/character/SpellMention";

export type FeatureLike = { name: string; level: number; description: string; grantedSpells?: GrantedSpell[] };

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
 */
export function FeatureEntry({
  feature,
  reached,
  edition,
}: {
  feature: FeatureLike;
  reached: boolean;
  edition: Edition;
}) {
  const grantedSpells = feature.grantedSpells ?? [];
  const spellNames = grantedSpells
    .map((grant) => grant.spellName)
    .filter((name): name is string => Boolean(name));

  return (
    <div className={cn("rounded-(--radius-sm) bg-background-darken/60 px-3 py-2", !reached && "opacity-60")}>
      <details className="flex flex-wrap items-center gap-2">
        <summary className="font-semibold text-fontcolor w-full">
          <span className="font-semibold text-fontcolor">{feature.name}</span>
          <Badge variant="muted">Level {feature.level}</Badge>
          {!reached && <Badge variant="outline">Locked</Badge>}
          {reached &&
              grantedSpells.map((grant, index) => (
                  <Badge key={index} variant="solid">
                    {grantedSpellBadgeLabel(grant)}
                  </Badge>
              ))}
        </summary>

        <div className="basis-full leading-4 mt-1 whitespace-pre-line text-xs">
          <TextWithSpellMentions
              text={feature.description}
              spellNames={spellNames}
              edition={edition}
          />
        </div>
      </details>
    </div>
  );
}
