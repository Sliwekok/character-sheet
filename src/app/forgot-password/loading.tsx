import { AuthLayoutSkeleton } from "@/components/auth/AuthForm";

/** Route-level skeleton - same shape as the form it stands in for. */
export default function Loading() {
  return <AuthLayoutSkeleton fields={1} />;
}
