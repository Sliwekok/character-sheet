"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { PublicUser } from "@/interfaces/Auth";
import { apiFetch } from "@/utils/api";
import {
    flushBeforeSignOut,
    getSyncState,
    setUnauthorizedHandler,
    signOutCleanup,
    startSync,
    stopSync,
    subscribeSync,
    SyncState,
} from "@/utils/sync";

/**
 * App-wide auth state. Accounts are optional - nothing in the app is
 * locked behind signing in; an account only adds cloud sync of characters
 * (see utils/sync.ts). Mounted once in the root layout.
 *
 * `status` starts as "loading" while `/api/auth/me` answers, so UI that
 * depends on it (the nav's account button, "fetch this character from the
 * server?" fallbacks) can show a skeleton instead of flashing "Sign in".
 */

export type AuthStatus = "loading" | "authenticated" | "anonymous";

export interface SignOutResult {
    /** False when there were unsynced changes and `force` wasn't set - nothing was signed out. */
    signedOut: boolean;
    pendingCount: number;
}

interface AuthContextValue {
    status: AuthStatus;
    user: PublicUser | null;
    signIn: (email: string, password: string) => Promise<PublicUser>;
    register: (input: { email: string; password: string; displayName?: string }) => Promise<PublicUser>;
    /** Uploads pending changes first; with unsynced changes left it refuses unless `force` is set. */
    signOut: (options?: { force?: boolean }) => Promise<SignOutResult>;
    /** For flows that sign in on the server side (password reset) - adopts the returned user. */
    acceptUser: (user: PublicUser) => void;
    refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [status, setStatus] = useState<AuthStatus>("loading");
    const [user, setUser] = useState<PublicUser | null>(null);

    const adopt = useCallback((next: PublicUser | null) => {
        setUser(next);
        setStatus(next ? "authenticated" : "anonymous");
        if (next) void startSync(next.id);
        else stopSync();
    }, []);

    const refresh = useCallback(async () => {
        try {
            const { user: me } = await apiFetch<{ user: PublicUser | null }>("/api/auth/me");
            adopt(me);
        } catch {
            // Server unreachable (offline, DB down): behave as signed out -
            // the app is fully usable locally - and don't touch local data.
            setUser(null);
            setStatus("anonymous");
        }
    }, [adopt]);

    useEffect(() => {
        void refresh();
        setUnauthorizedHandler(() => {
            setUser(null);
            setStatus("anonymous");
        });
        return () => setUnauthorizedHandler(null);
    }, [refresh]);

    const signIn = useCallback(async (email: string, password: string) => {
        const { user: signedIn } = await apiFetch<{ user: PublicUser }>("/api/auth/login", {
            method: "POST",
            body: { email, password },
        });
        adopt(signedIn);
        return signedIn;
    }, [adopt]);

    const register = useCallback(async (input: { email: string; password: string; displayName?: string }) => {
        const { user: created } = await apiFetch<{ user: PublicUser }>("/api/auth/register", {
            method: "POST",
            body: input,
        });
        adopt(created);
        return created;
    }, [adopt]);

    const signOut = useCallback(async (options?: { force?: boolean }): Promise<SignOutResult> => {
        const pendingCount = await flushBeforeSignOut();
        if (pendingCount > 0 && !options?.force) return { signedOut: false, pendingCount };

        try {
            await apiFetch("/api/auth/logout", { method: "POST" });
        } catch {
            // Even if the server can't be reached, sign this browser out locally.
        }
        signOutCleanup();
        setUser(null);
        setStatus("anonymous");
        return { signedOut: true, pendingCount };
    }, []);

    const value = useMemo<AuthContextValue>(
        () => ({ status, user, signIn, register, signOut, acceptUser: adopt, refresh }),
        [status, user, signIn, register, signOut, adopt, refresh]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used inside <AuthProvider> (see app/layout.tsx).");
    return context;
}

const SERVER_SYNC_STATE: SyncState = getSyncState();

/** Live sync status (phase, pending changes, last sync time) for UI like the account page. */
export function useSyncStatus(): SyncState {
    return useSyncExternalStore(subscribeSync, getSyncState, () => SERVER_SYNC_STATE);
}
