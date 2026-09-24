import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthLayoutSkeleton } from "@/components/auth/AuthForm";
import ResetPasswordForm from "./ResetPasswordForm";

export const metadata: Metadata = { title: "Reset password · Character Sheet" };

// ResetPasswordForm reads the query string (useSearchParams), which Next.js requires a
// Suspense boundary around - same pattern as newCharacter/manual/page.tsx.
export default function Page() {
  return (
    <Suspense fallback={<AuthLayoutSkeleton fields={2} />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
