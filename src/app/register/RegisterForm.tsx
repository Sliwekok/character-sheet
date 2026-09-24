"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  AuthLayout,
  AuthLayoutSkeleton,
  FormField,
  FormMessage,
  PASSWORD_HINT,
  PasswordField,
  safeNextPath,
} from "@/components/auth/AuthForm";
import { loadCharacters } from "@/utils/storage";

export default function RegisterForm() {
  const { status, user, register } = useAuth();
  const router = useRouter();
  const next = safeNextPath(useSearchParams().get("next"));

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [localCount, setLocalCount] = useState(0);

  useEffect(() => setLocalCount(loadCharacters().length), []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("The passwords don't match.");

    setSubmitting(true);
    try {
      await register({ email, password, displayName: displayName || undefined });
      router.replace(next);
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  }

  if (status === "loading") return <AuthLayoutSkeleton fields={4} />;

  if (status === "authenticated" && user && !submitting) {
    return (
      <AuthLayout eyebrow="Account" title="You already have an account">
        <p className="text-sm text-fontcolor-secondary">
          Signed in as <span className="text-fontcolor">{user.email}</span>.
        </p>
        <Button href={next}>Continue</Button>
      </AuthLayout>
    );
  }

  const loginHref = `/login${next !== "/home" ? `?next=${encodeURIComponent(next)}` : ""}`;

  return (
    <AuthLayout
      eyebrow="Join the party"
      title="Create an account"
      subtitle="Back up your characters and open them on any device. Everything else works without an account too."
      footer={
        <>
          Already have an account?{" "}
          <Link href={loginHref} className="text-foreground underline-offset-4 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
        {error && <FormMessage tone="error">{error}</FormMessage>}
        {localCount > 0 && (
          <FormMessage tone="info">
            The {localCount} character{localCount === 1 ? "" : "s"} saved in this browser will be added to your new
            account.
          </FormMessage>
        )}

        <FormField
          label="Display name"
          name="displayName"
          autoComplete="nickname"
          maxLength={60}
          placeholder="Optional"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
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
          autoComplete="new-password"
          required
          minLength={8}
          hint={PASSWORD_HINT}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <PasswordField
          label="Confirm password"
          name="confirm"
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />

        <Button type="submit" disabled={submitting || !email || !password || !confirm} className="w-full">
          {submitting ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </AuthLayout>
  );
}
