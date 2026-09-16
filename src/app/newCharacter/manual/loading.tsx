import Nav from "@/app/layout/nav";
import { Card, CardContent, Container, Skeleton, SkeletonHeading } from "@/components/ui";

const STEP_COUNT = 7;

/** Placeholder for `StepProgress`'s row of numbered, connected step circles. */
function StepProgressSkeleton() {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-3">
      {Array.from({ length: STEP_COUNT }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-4 w-16" />
          {i < STEP_COUNT - 1 && <span aria-hidden className="mx-1 h-px w-4 bg-border-strong" />}
        </div>
      ))}
    </div>
  );
}

/**
 * Shown automatically by Next.js while `/newCharacter/manual` is loading.
 * `ManualWizard` renders its own `<Nav />` rather than relying on the root
 * layout's `NavGate` (this is one of `NavGate`'s deliberately-nav-less
 * routes - see `HIDDEN_PATHS`), so this skeleton renders one too, otherwise
 * the nav bar would pop in only once the real wizard mounts. Mirrors the
 * step indicator plus a generic step-form card, since which step's fields
 * actually render first depends on `?edit=<id>`.
 */
export default function ManualWizardLoading() {
  return (
    <>
      <Nav />
      <Container size="lg" className="pb-24">
        <SkeletonHeading subtitleLines={1} />

        <div className="mt-8 flex flex-col gap-8">
          <StepProgressSkeleton />

          <Card>
            <CardContent className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-11 w-full" />
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between border-t border-border pt-6">
                <Skeleton className="h-11 w-24" />
                <Skeleton className="h-11 w-28" />
              </div>
            </CardContent>
          </Card>
        </div>
      </Container>
    </>
  );
}
