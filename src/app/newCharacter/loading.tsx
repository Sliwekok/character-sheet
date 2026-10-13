import { Card, Container, Skeleton, SkeletonHeading } from "@/components/ui";
import { cn } from "@/utils/cn";
import { MODE_CARD_CLASSES, MODE_GRID_CLASSES } from "./modeCardClasses";

/**
 * Placeholder for one of the three "New character" mode cards. Mirrors
 * `ModeCard` section by section (icon medallion, title + tagline,
 * description, highlights list, CTA) inside the same card shell, so the
 * real cards drop into place without the layout jumping.
 */
function ModeCardSkeleton({ recommended = false }: { recommended?: boolean }) {
  return (
    <Card className={cn(MODE_CARD_CLASSES, recommended && "border-foreground/45")}>
      <div className="flex items-start justify-between gap-3">
        <Skeleton className="h-14 w-14 rounded-full" />
        {recommended && <Skeleton className="h-6 w-28 rounded-full" />}
      </div>

      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-3 w-40" />
      </div>

      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-1/2" />
      </div>

      <div className="flex flex-col gap-3 border-t border-border pt-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-2/3" />
      </div>

      <Skeleton className="h-11 w-full rounded-(--radius-lg)" />
    </Card>
  );
}

/**
 * Shown automatically by Next.js while `/newCharacter` is loading. Uses the
 * page's own grid + card classes so the three skeleton cards sit in one row
 * at the same height, exactly where Import / Step-by-step / Random appear.
 */
export default function NewCharacterLoading() {
  return (
    <Container size="lg" className="pb-24">
      <SkeletonHeading align="center" subtitleLines={1} />

      <div className={MODE_GRID_CLASSES}>
        <ModeCardSkeleton />
        <ModeCardSkeleton recommended />
        <ModeCardSkeleton />
      </div>
    </Container>
  );
}
