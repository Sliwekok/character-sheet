import { Card, CardContent, CardHeader, Container, Skeleton, SkeletonHeading } from "@/components/ui";

/**
 * Shown automatically by Next.js while `/search` is loading - covers both
 * landing on the page directly and clicking a result in the nav search box
 * (which navigates here with `edition`/`type`/`name` query params, see
 * `nav.tsx`). Shaped like a generic compendium entry (`SearchResultDetail`)
 * since the real content varies a lot by item type; close enough to read as
 * "a result is coming" rather than a blank page.
 */
export default function SearchLoading() {
  return (
    <Container size="lg" className="pb-24">
      <SkeletonHeading subtitleLines={1} />

      <div className="mt-8 flex flex-col gap-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-40" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-24 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
