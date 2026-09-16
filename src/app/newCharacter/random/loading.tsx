import { Card, CardContent, Container, Skeleton, SkeletonHeading } from "@/components/ui";

/** Placeholder for one of the two starting-mode cards ("All random" / "Guided random"). */
function RandomModeSkeleton() {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-6 w-32" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
        <Skeleton className="mt-2 h-11 w-40" />
      </CardContent>
    </Card>
  );
}

/**
 * Shown automatically by Next.js while `/newCharacter/random` is loading.
 * Mirrors `RandomCharacterPage`'s initial "choose" mode (before the player
 * picks "All random" or "Guided random"), which is what actually renders
 * first regardless of which mode they end up in.
 */
export default function RandomLoading() {
  return (
    <Container size="lg" className="pb-24">
      <SkeletonHeading />

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <RandomModeSkeleton />
        <RandomModeSkeleton />
      </div>
    </Container>
  );
}
