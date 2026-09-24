"use client";

import { InputHTMLAttributes, ReactNode, useId, useState } from "react";
import { Card, CardContent, Container, SectionHeading, Skeleton, SkeletonHeading, TextInput } from "@/components/ui";
import { cn } from "@/utils/cn";

/**
 * Building blocks shared by the account pages (/login, /register,
 * /forgot-password, /reset-password, /account) so they all look alike and
 * match the rest of the app's cards and headings.
 */

export function AuthLayout({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Container size="md" className="pb-24">
      <div className="mx-auto w-full max-w-md">
        <SectionHeading eyebrow={eyebrow} title={title} subtitle={subtitle} align="center" />
        <Card className="mt-8">
          <CardContent className="flex flex-col gap-5 py-6">{children}</CardContent>
        </Card>
        {footer && <div className="mt-6 text-center text-sm text-fontcolor-secondary">{footer}</div>}
      </div>
    </Container>
  );
}

/** Matching skeleton for `AuthLayout` - used by the routes' `loading.tsx` and Suspense fallbacks. */
export function AuthLayoutSkeleton({ fields = 2 }: { fields?: number }) {
  return (
    <Container size="md" className="pb-24">
      <div className="mx-auto w-full max-w-md">
      <SkeletonHeading align="center" />
      <Card className="mt-8">
        <CardContent className="flex flex-col gap-5 py-6">
          {Array.from({ length: fields }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
          <Skeleton className="h-11 w-full rounded-(--radius-lg)" />
        </CardContent>
      </Card>
      <div className="mt-6 flex justify-center">
        <Skeleton className="h-4 w-56" />
      </div>
      </div>
    </Container>
  );
}

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: ReactNode;
  /** Right-aligned extra next to the label, e.g. a "Forgot password?" link. */
  labelAside?: ReactNode;
  /** Element pinned inside the right edge of the input, e.g. a Show/Hide toggle. */
  trailing?: ReactNode;
};

export function FormField({ label, hint, labelAside, trailing, id, className, ...rest }: FieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={inputId} className="text-sm font-medium text-fontcolor">
          {label}
        </label>
        {labelAside}
      </div>
      <div className="relative">
        <TextInput id={inputId} {...rest} className={trailing ? "pr-16" : undefined} />
        {trailing && <div className="absolute inset-y-0 right-3 flex items-center">{trailing}</div>}
      </div>
      {hint && <p className="text-xs text-fontcolor-secondary">{hint}</p>}
    </div>
  );
}

/** Password field with a Show/Hide toggle. */
export function PasswordField(props: Omit<FieldProps, "type" | "trailing">) {
  const [visible, setVisible] = useState(false);
  return (
    <FormField
      {...props}
      type={visible ? "text" : "password"}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="cursor-pointer text-xs font-medium text-fontcolor-secondary hover:text-fontcolor"
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
        >
          {visible ? "Hide" : "Show"}
        </button>
      }
    />
  );
}

export function FormMessage({ tone, children }: { tone: "error" | "success" | "info"; children: ReactNode }) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "rounded-(--radius) border px-4 py-3 text-sm",
        tone === "error" && "border-foreground-danger/60 bg-foreground-danger/20 text-fontcolor",
        tone === "success" && "border-foreground/40 bg-foreground/10 text-fontcolor",
        tone === "info" && "border-border bg-background-darken/40 text-fontcolor-secondary"
      )}
    >
      {children}
    </div>
  );
}

/**
 * Only same-site relative paths are allowed as a post-login redirect -
 * anything else (absolute URLs, protocol-relative `//evil.com`) falls back
 * to /home, so `?next=` can't be used to bounce people to another site.
 */
export function safeNextPath(next: string | null | undefined, fallback = "/home"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}

export const PASSWORD_HINT = "At least 8 characters.";
