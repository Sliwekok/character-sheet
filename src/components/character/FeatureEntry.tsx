import { Badge } from "@/components/ui";
import { cn } from "@/utils/cn";

export type FeatureLike = { name: string; level: number; description: string };

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
 */
export function FeatureEntry({ feature, reached }: { feature: FeatureLike; reached: boolean }) {
  return (
    <div className={cn("rounded-(--radius-sm) bg-background-darken/60 px-3 py-2", !reached && "opacity-60")}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold text-fontcolor">{feature.name}</span>
        <Badge variant="muted">Level {feature.level}</Badge>
        {!reached && <Badge variant="outline">Locked</Badge>}
      </div>
      <p className="mt-1 whitespace-pre-line text-xs">{feature.description}</p>
    </div>
  );
}
