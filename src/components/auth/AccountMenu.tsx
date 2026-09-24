"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button, Skeleton } from "@/components/ui";
import { cn } from "@/utils/cn";
import { useAuth, useSyncStatus } from "./AuthProvider";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "?") + (parts[1]?.[0] ?? "")).toUpperCase();
}

/** Small dot on the avatar: nothing when synced, pulsing while syncing, dim when offline/pending, red on error. */
function SyncDot() {
  const sync = useSyncStatus();
  if (!sync.active) return null;
  const tone =
    sync.phase === "error"
      ? "bg-foreground-danger"
      : sync.phase === "syncing"
        ? "bg-foreground animate-pulse"
        : sync.phase === "offline" || sync.pendingCount > 0
          ? "bg-fontcolor-secondary"
          : null;
  if (!tone) return null;
  return <span className={cn("absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-background-darken", tone)} />;
}

/**
 * The nav bar's account control: a skeleton while the session check runs,
 * "Sign in" when signed out, or an avatar with a small dropdown (account
 * page, sync state, sign out) when signed in. Signing in is always
 * optional - nothing else in the nav depends on it.
 */
export function AccountMenu() {
  const { status, user, signOut } = useAuth();
  const sync = useSyncStatus();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    function handleClick(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  if (status === "loading") return <Skeleton className="h-9 w-9 rounded-full" />;

  if (status === "anonymous" || !user) {
    const next = pathname && !["/login", "/register", "/forgot-password", "/reset-password"].includes(pathname) ? pathname : "/home";
    return (
      <Button href={`/login?next=${encodeURIComponent(next)}`} variant="secondary" size="sm">
        Sign in
      </Button>
    );
  }

  const syncLine =
    sync.phase === "syncing"
      ? "Syncing…"
      : sync.phase === "offline"
        ? "Offline - will sync later"
        : sync.phase === "error"
          ? "Sync failed"
          : sync.pendingCount > 0
            ? `${sync.pendingCount} change${sync.pendingCount === 1 ? "" : "s"} pending`
            : "All characters synced";

  async function handleSignOut() {
    const result = await signOut();
    // Unsynced changes - let the account page explain and offer "sign out anyway".
    if (!result.signedOut) router.push(`/account?unsynced=${result.pendingCount}`);
    else router.push("/home");
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-border-strong bg-background-elevated text-xs font-semibold text-fontcolor transition-colors hover:border-foreground"
      >
        {initials(user.displayName || user.email)}
        <SyncDot />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-11 z-40 w-64 overflow-hidden rounded-(--radius) border border-border bg-background-darken shadow-[0_12px_30px_-16px_rgba(0,0,0,0.9)]"
        >
          <div className="border-b border-border px-4 py-3">
            <p className="truncate text-sm font-medium text-fontcolor">{user.displayName}</p>
            <p className="truncate text-xs text-fontcolor-secondary">{user.email}</p>
            <p className="mt-1 text-xs text-fontcolor-secondary">{syncLine}</p>
          </div>
          <Link
            role="menuitem"
            href="/account"
            className="block px-4 py-2.5 text-sm text-fontcolor-secondary transition-colors hover:bg-background-elevated hover:text-fontcolor"
          >
            Account &amp; sync
          </Link>
          <button
            role="menuitem"
            type="button"
            onClick={handleSignOut}
            className="block w-full cursor-pointer px-4 py-2.5 text-left text-sm text-fontcolor-secondary transition-colors hover:bg-background-elevated hover:text-fontcolor"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
