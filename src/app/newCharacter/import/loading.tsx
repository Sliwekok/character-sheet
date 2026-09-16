import { Card, CardContent, Container, Skeleton, SkeletonHeading } from "@/components/ui";

/** Placeholder for one of the two import method cards ("From a file" / "From D&D Beyond"). */
function ImportOptionSkeleton() {
  return (
    <Card>
      <CardContent className="flex flex-col items-start gap-4">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-6 w-36" />
        <div className="flex w-full flex-col gap-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
        <Skeleton className="h-11 w-36" />
      </CardContent>
    </Card>
  );
}

/**
 * Shown automatically by Next.js while `/newCharacter/import` is loading.
 * Mirrors `ImportCharacterPage`'s pre-import state (the "From a file" /
 * "From D&D Beyond" cards) - the imported-character preview only appears
 * after a file/DDB fetch resolves client-side, which this route load
 * happens before.
 */
export default function ImportLoading() {
  return (
    <Container size="md" className="pb-24">
      <SkeletonHeading />

      <div className="mt-8 flex flex-col gap-6">
        <ImportOptionSkeleton />
        <ImportOptionSkeleton />
      </div>
    </Container>
  );
}
