import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthLayoutSkeleton } from "@/components/auth/AuthForm";
import LoginForm from "./LoginForm";

export const metadata: Metadata = { title: "Sign in · Character Sheet" };

// LoginForm reads the query string (useSearchParams), which Next.js requires a
// Suspense boundary around - same pattern as newCharacter/manual/page.tsx.
export default function Page() {
  return (
    <Suspense fallback={<AuthLayoutSkeleton fields={2} />}>
      <LoginForm />
    </Suspense>
  );
}
