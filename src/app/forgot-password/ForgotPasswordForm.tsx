"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui";
import { AuthLayout, FormField, FormMessage } from "@/components/auth/AuthForm";
import { apiFetch } from "@/utils/api";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await apiFetch("/api/auth/forgot-password", { method: "POST", body: { email } });
      setSentTo(email.trim());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  const footer = (
    <Link href="/login" className="text-foreground underline-offset-4 hover:underline">
      Back to sign in
    </Link>
  );

  if (sentTo) {
    return (
      <AuthLayout eyebrow="Password reset" title="Check your email" footer={footer}>
        <FormMessage tone="success">
          If an account exists for <span className="font-medium">{sentTo}</span>, we&apos;ve sent it a link to choose
          a new password.
        </FormMessage>
        <p className="text-sm text-fontcolor-secondary">
          The link works once and expires in 60 minutes. Nothing arrived after a few minutes? Check your spam folder,
          or{" "}
          <button
            type="button"
            onClick={() => setSentTo(null)}
            className="cursor-pointer text-foreground underline-offset-4 hover:underline"
          >
            try again
          </button>
          .
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      eyebrow="Password reset"
      title="Forgot your password?"
      subtitle="Enter the email you signed up with and we'll send you a link to choose a new one."
      footer={footer}
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
        <Button type="submit" disabled={submitting || !email} className="w-full">
          {submitting ? "Sending…" : "Send reset link"}
        </Button>
      </form>
    </AuthLayout>
  );
}
