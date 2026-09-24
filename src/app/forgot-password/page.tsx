import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthLayoutSkeleton } from "@/components/auth/AuthForm";
import ForgotPasswordForm from "./ForgotPasswordForm";

export const metadata: Metadata = { title: "Forgot password · Character Sheet" };

// ForgotPasswordForm reads the query string (useSearchParams), which Next.js requires a
// Suspense boundary around - same pattern as newCharacter/manual/page.tsx.
export default function Page() {
  return (
    <Suspense fallback={<AuthLayoutSkeleton fields={1} />}>
      <ForgotPasswordForm />
    </Suspense>
  );
}
