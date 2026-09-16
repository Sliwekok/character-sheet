import { Card, CardContent, Container, Skeleton, SkeletonHeading } from "@/components/ui";

/**
 * Shown automatically by Next.js while `/about` is loading. Mirrors
 * `AboutPage`'s single text card so the page doesn't flash blank/stuck
 * during navigation.
 */
export default function AboutLoading() {
  return (
    <Container size="md" className="pb-24">
      <SkeletonHeading />

      <Card className="mt-8">
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-1/2" />
          </div>
        </CardContent>
      </Card>
    </Container>
  );
}
