import { Container, Skeleton, SkeletonHeading } from "@/components/ui";

/** Placeholder for /campaigns while the route or the campaign list loads. */
export function CampaignsSkeleton() {
  return (
    <Container size="lg" className="pb-24">
      <SkeletonHeading />
      <div className="mt-8 flex flex-col gap-6">
        <Skeleton className="h-40 w-full rounded-(--radius-lg)" />
        <Skeleton className="h-56 w-full rounded-(--radius-lg)" />
      </div>
    </Container>
  );
}
