"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  AuthLayout,
  AuthLayoutSkeleton,
  FormMessage,
  PASSWORD_HINT,
  PasswordField,
} from "@/components/auth/AuthForm";
import { PublicUser } from "@/interfaces/Auth";
import { apiFetch } from "@/utils/api";

export default function ResetPasswordForm() {
  const token = useSearchParams().get("token") ?? "";
  const router = useRouter();
  const { acceptUser } = useAuth();

  // null = still checking the link
  const [linkValid, setLinkValid] = useState<boolean | null>(token ? null : false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    apiFetch<{ valid: boolean }>(`/api/auth/reset-password?token=${encodeURIComponent(token)}`)
      .then(({ valid }) => !cancelled && setLinkValid(valid))
      // Can't check right now - let them try; the POST validates again anyway.
      .catch(() => !cancelled && setLinkValid(true));
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("The passwords don't match.");

    setSubmitting(true);
    try {
      const { user } = await apiFetch<{ user: PublicUser }>("/api/auth/reset-password", {
        method: "POST",
        body: { token, password },
      });
      // The server signed this browser in (and signed every other device out).
      acceptUser(user);
      router.replace("/account?passwordChanged=1");
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  }

  if (linkValid === null) return <AuthLayoutSkeleton fields={2} />;

  if (!linkValid) {
    return (
      <AuthLayout
        eyebrow="Password reset"
        title="Link expired"
        footer={
          <Link href="/login" className="text-foreground underline-offset-4 hover:underline">
            Back to sign in
          </Link>
        }
      >
        <FormMessage tone="error">
          This password reset link is invalid, was already used, or has expired (links last 60 minutes).
        </FormMessage>
        <Button href="/forgot-password">Request a new link</Button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      eyebrow="Password reset"
      title="Choose a new password"
      subtitle="You'll be signed in here, and signed out everywhere else."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
        {error && <FormMessage tone="error">{error}</FormMessage>}
        <PasswordField
          label="New password"
          name="password"
          autoComplete="new-password"
          required
          minLength={8}
          hint={PASSWORD_HINT}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <PasswordField
          label="Confirm new password"
          name="confirm"
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        <Button type="submit" disabled={submitting || !password || !confirm} className="w-full">
          {submitting ? "Saving…" : "Set new password"}
        </Button>
      </form>
    </AuthLayout>
  );
}
