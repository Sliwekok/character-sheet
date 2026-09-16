import { Card, CardContent, CardHeader, Container, Skeleton, SkeletonHeading } from "@/components/ui";

const TABS = ["Actions", "Spells", "Inventory", "Features & Traits", "Background"];

/** Placeholder for the sidebar's `AbilityScoresPanel` (6 ability scores). */
function AbilityScoresSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-32" />
      </CardHeader>
      <CardContent className="grid grid-cols-3 gap-2 lg:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-14" />
        ))}
      </CardContent>
    </Card>
  );
}

/** Placeholder for the sidebar's `SkillsPanel` (all 18 skills, one row each). */
function SkillsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-16" />
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-6 w-full" />
        ))}
      </CardContent>
    </Card>
  );
}

/** Placeholder for the sidebar's `StatusPanel` (inspiration, death saves, conditions, exhaustion, concentration). */
function StatusSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-20" />
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-3/4" />
      </CardContent>
    </Card>
  );
}

/**
 * Shown automatically by Next.js while `/character/[id]` is loading.
 * Mirrors the real page's layout - header stat bar, sticky sidebar
 * (ability scores / skills / status), and a tabbed main column - closely
 * enough that navigating in from a character card on `/home` swaps
 * straight into a matching skeleton instead of a blank/frozen-looking gap.
 */
export default function CharacterSheetLoading() {
  return (
    <Container size="2xl" className="pb-24">
      <SkeletonHeading subtitleLines={1} />

      <div className="mt-8 flex flex-col gap-6">
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr] lg:items-start">
          <div className="flex flex-col gap-4">
            <AbilityScoresSkeleton />
            <SkillsSkeleton />
            <StatusSkeleton />
          </div>

          <div className="flex min-w-0 flex-col gap-4">
            <div className="flex flex-wrap gap-x-1 gap-y-2 border-b border-border">
              {TABS.map((tab, i) => (
                <div key={tab} className="px-3 py-2.5 sm:px-4">
                  <Skeleton className={i === 0 ? "h-4 w-16" : "h-4 w-20"} />
                </div>
              ))}
            </div>

            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-24" />
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Container>
  );
}
