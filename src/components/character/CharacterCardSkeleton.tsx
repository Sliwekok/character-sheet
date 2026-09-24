import { Card, CardContent, CardHeader, Skeleton } from "@/components/ui";

/** Placeholder for a single `CharacterCard` while the real list loads. */
export function CharacterCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-5 w-16 rounded-full" />
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex gap-3">
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-5 w-28 rounded-full" />
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-9" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
