import { Card, CardContent, Container, Skeleton, SkeletonHeading } from "@/components/ui";

/** Placeholder for one of the three "New character" mode cards (Import / Step-by-step / Random). */
function ModeCardSkeleton() {
  return (
    <Card className="flex h-full flex-col">
      <CardContent className="flex flex-1 flex-col gap-3">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-6 w-32" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Shown automatically by Next.js while `/newCharacter` is loading. Mirrors
 * `NewCharacterPage`'s three-card mode picker (Import / Step-by-step /
 * Random) so the page doesn't feel stuck between the old page and this one.
 */
export default function NewCharacterLoading() {
  return (
    <Container size="md" className="pb-24">
      <SkeletonHeading />

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <ModeCardSkeleton key={i} />
        ))}
      </div>
    </Container>
  );
}
