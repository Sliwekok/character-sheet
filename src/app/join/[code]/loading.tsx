import { Container, Skeleton, SkeletonHeading } from "@/components/ui";

/** Route-level skeleton for the invite page. */
export default function Loading() {
  return (
    <Container size="md" className="pb-24">
      <SkeletonHeading subtitleLines={0} />
      <Skeleton className="mt-8 h-48 w-full rounded-(--radius-lg)" />
    </Container>
  );
}
