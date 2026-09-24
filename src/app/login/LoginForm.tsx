"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui";
import { useAuth } from "@/components/auth/AuthProvider";
import { AuthLayout, AuthLayoutSkeleton, FormField, FormMessage, PasswordField, safeNextPath } from "@/components/auth/AuthForm";

export default function LoginForm() {
  const { status, user, signIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNextPath(searchParams.get("next"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signIn(email, password);
      router.replace(next);
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  }

  if (status === "loading") return <AuthLayoutSkeleton fields={2} />;

  if (status === "authenticated" && user && !submitting) {
    return (
      <AuthLayout eyebrow="Account" title="You're signed in">
        <p className="text-sm text-fontcolor-secondary">
          Signed in as <span className="text-fontcolor">{user.email}</span>.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button href={next}>Continue</Button>
          <Button href="/account" variant="secondary">
            Account
          </Button>
        </div>
      </AuthLayout>
    );
  }

  const registerHref = `/register${next !== "/home" ? `?next=${encodeURIComponent(next)}` : ""}`;

  return (
    <AuthLayout
      eyebrow="Welcome back"
      title="Sign in"
      subtitle="Sync your characters across devices. You can keep using the app without an account."
      footer={
        <>
          New here?{" "}
          <Link href={registerHref} className="text-foreground underline-offset-4 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
        {error && <FormMessage tone="error">{error}</FormMessage>}

        <FormField
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <PasswordField
          label="Password"
          name="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          labelAside={
            <Link href="/forgot-password" className="text-xs text-foreground underline-offset-4 hover:underline">
              Forgot password?
            </Link>
          }
        />

        <Button type="submit" disabled={submitting || !email || !password} className="w-full">
          {submitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </AuthLayout>
  );
}
