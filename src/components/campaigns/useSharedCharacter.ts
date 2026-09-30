"use client";

import { useEffect, useState } from "react";
import type { SharedCharacterView } from "@/interfaces/Campaign";
import { fetchSharedCharacter } from "@/utils/campaigns";
import { useAuth } from "@/components/auth/AuthProvider";

/**
 * Another player's character, fetched read-only from the server (never
 * written to localStorage - it isn't ours to sync). Pass `ownerId = null`
 * to disable. `undefined` = loading, `null` = not found / not shared with
 * this viewer (see `error` for the server's message).
 *
 * Re-fetches when the viewer signs in or out, since that can change what
 * they're allowed to see.
 */
export function useSharedCharacter(ownerId: string | null, characterId: string | null | undefined) {
    const { status } = useAuth();
    const [view, setView] = useState<SharedCharacterView | null | undefined>(undefined);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!ownerId || !characterId) {
            setView(null);
            return;
        }
        if (status === "loading") {
            setView(undefined);
            return;
        }
        let cancelled = false;
        setView(undefined);
        fetchSharedCharacter(ownerId, characterId)
            .then((result) => {
                if (cancelled) return;
                setView(result);
                setError(null);
            })
            .catch((err) => {
                if (cancelled) return;
                setView(null);
                setError((err as Error).message);
            });
        return () => {
            cancelled = true;
        };
    }, [ownerId, characterId, status]);

    return { view, error };
}
