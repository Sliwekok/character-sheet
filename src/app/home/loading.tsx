import { Container, SkeletonHeading } from "@/components/ui";
import { CharacterCardSkeleton } from "@/components/character/CharacterCardSkeleton";

/**
 * Shown automatically by Next.js while `/home` (and the character list it
 * reads from local storage) is loading - see the other routes' `loading.tsx`
 * for the same pattern. Mirrors `HomePage`'s grid of `CharacterCard`s so
 * navigating here doesn't feel stuck between the old page and the new one.
 */
export default function HomeLoading() {
  return (
    <Container size="xl" className="pb-24">
      <SkeletonHeading />

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <CharacterCardSkeleton key={i} />
        ))}
      </div>
    </Container>
  );
}
