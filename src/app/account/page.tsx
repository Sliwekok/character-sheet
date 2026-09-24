import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthLayoutSkeleton } from "@/components/auth/AuthForm";
import AccountView from "./AccountView";

export const metadata: Metadata = { title: "Account · Character Sheet" };

// AccountView reads the query string (useSearchParams), which Next.js requires a
// Suspense boundary around - same pattern as newCharacter/manual/page.tsx.
export default function Page() {
  return (
    <Suspense fallback={<AuthLayoutSkeleton fields={3} />}>
      <AccountView />
    </Suspense>
  );
}
