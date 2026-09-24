"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert, Button, Card, CardContent, CardHeader, CardTitle, Container, SectionHeading } from "@/components/ui";
import { useAuth, useSyncStatus } from "@/components/auth/AuthProvider";
import { AuthLayoutSkeleton, FormMessage, PASSWORD_HINT, PasswordField } from "@/components/auth/AuthForm";
import { apiFetch } from "@/utils/api";
import { syncNow } from "@/utils/sync";

function formatDateTime(iso: string | null): string {
  if (!iso) return "never";
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function SyncCard() {
  const sync = useSyncStatus();
  const [busy, setBusy] = useState(false);

  const label =
    sync.phase === "syncing"
      ? "Syncing…"
      : sync.phase === "offline"
        ? "Offline - changes are saved in this browser and will upload when you're back online."
        : sync.phase === "error"
          ? `Sync failed: ${sync.error}`
          : sync.pendingCount > 0
            ? `${sync.pendingCount} change${sync.pendingCount === 1 ? "" : "s"} waiting to upload.`
            : "All characters are backed up.";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Character sync</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm text-fontcolor-secondary">
        <p>
          Characters are saved in this browser first, then backed up to your account in the background. Open them on
          any device by signing in.
        </p>
        <p className={sync.phase === "error" ? "text-fontcolor" : undefined}>{label}</p>
        <p>Last synced: {formatDateTime(sync.lastSyncedAt)}</p>
        <div>
          <Button
            variant="secondary"
            size="sm"
            disabled={busy || sync.phase === "syncing"}
            onClick={async () => {
              setBusy(true);
              await syncNow();
              setBusy(false);
            }}
          >
            Sync now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ChangePasswordCard() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setDone(false);
    if (next.length < 8) return setError("New password must be at least 8 characters.");
    if (next !== confirm) return setError("The new passwords don't match.");

    setSubmitting(true);
    try {
      await apiFetch("/api/auth/change-password", {
        method: "POST",
        body: { currentPassword: current, newPassword: next },
      });
      setDone(true);
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change password</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          {error && <FormMessage tone="error">{error}</FormMessage>}
          {done && <FormMessage tone="success">Password changed. Other devices have been signed out.</FormMessage>}
          <PasswordField
            label="Current password"
            autoComplete="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
          />
          <PasswordField
            label="New password"
            autoComplete="new-password"
            hint={PASSWORD_HINT}
            value={next}
            onChange={(e) => setNext(e.target.value)}
          />
          <PasswordField
            label="Confirm new password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          <div>
            <Button type="submit" disabled={submitting || !current || !next || !confirm}>
              {submitting ? "Saving…" : "Change password"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default function AccountView() {
  const { status, user, signOut } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const passwordChanged = searchParams.get("passwordChanged") === "1";
  // `?unsynced=N` - the nav menu's Sign out bounced here because N changes
  // couldn't be uploaded; show the same "sign out anyway?" prompt.
  const unsyncedParam = Number(searchParams.get("unsynced"));
  const [unsyncedWarning, setUnsyncedWarning] = useState<number | null>(
    Number.isFinite(unsyncedParam) && unsyncedParam > 0 ? unsyncedParam : null
  );
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut(force = false) {
    setSigningOut(true);
    const result = await signOut({ force });
    if (!result.signedOut) {
      setUnsyncedWarning(result.pendingCount);
      setSigningOut(false);
      return;
    }
    router.push("/home");
  }

  if (status === "loading") return <AuthLayoutSkeleton fields={3} />;

  if (status === "anonymous" || !user) {
    return (
      <Container size="md" className="pb-24">
        <SectionHeading eyebrow="Account" title="You're not signed in" />
        <Card className="mt-8">
          <CardContent className="flex flex-col items-start gap-4 text-sm text-fontcolor-secondary">
            <p>
              Everything in the app works without an account - your characters are saved in this browser. Sign in to
              back them up and use them on other devices.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button href="/login?next=/account">Sign in</Button>
              <Button href="/register?next=/account" variant="secondary">
                Create an account
              </Button>
            </div>
          </CardContent>
        </Card>
      </Container>
    );
  }

  return (
    <>
      {unsyncedWarning !== null && (
        <Alert
          variant="confirm"
          title="Sign out with unsynced changes?"
          actions={
            <>
              <Button variant="danger" size="sm" className="ml-0" onClick={() => handleSignOut(true)}>
                Sign out anyway
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setUnsyncedWarning(null)}>
                Stay signed in
              </Button>
            </>
          }
        >
          {unsyncedWarning} change{unsyncedWarning === 1 ? " hasn't" : "s haven't"} reached the server yet (are you
          offline?). Signing out removes this account&apos;s characters from this browser, so those changes would be
          lost.
        </Alert>
      )}

      <Container size="md" className="pb-24">
        <SectionHeading eyebrow="Account" title={user.displayName || "Your account"} subtitle={user.email} />

        {passwordChanged && (
          <div className="mt-6">
            <FormMessage tone="success">Your password was changed and you&apos;re signed in.</FormMessage>
          </div>
        )}

        <div className="mt-8 flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-[10rem_1fr]">
              <span className="text-fontcolor-secondary">Display name</span>
              <span>{user.displayName}</span>
              <span className="text-fontcolor-secondary">Email</span>
              <span className="break-all">{user.email}</span>
              <span className="text-fontcolor-secondary">Member since</span>
              <span>{new Date(user.createdAt).toLocaleDateString(undefined, { dateStyle: "long" })}</span>
            </CardContent>
          </Card>

          <SyncCard />
          <ChangePasswordCard />

          <Card>
            <CardHeader>
              <CardTitle>Sign out</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-start gap-3 text-sm text-fontcolor-secondary">
              <p>Signing out removes this account&apos;s characters from this browser. They stay safe in your account.</p>
              <Button variant="secondary" disabled={signingOut} onClick={() => handleSignOut(false)}>
                {signingOut ? "Signing out…" : "Sign out"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </Container>
    </>
  );
}
