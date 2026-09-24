import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthLayoutSkeleton } from "@/components/auth/AuthForm";
import RegisterForm from "./RegisterForm";

export const metadata: Metadata = { title: "Create an account · Character Sheet" };

// RegisterForm reads the query string (useSearchParams), which Next.js requires a
// Suspense boundary around - same pattern as newCharacter/manual/page.tsx.
export default function Page() {
  return (
    <Suspense fallback={<AuthLayoutSkeleton fields={4} />}>
      <RegisterForm />
    </Suspense>
  );
}
