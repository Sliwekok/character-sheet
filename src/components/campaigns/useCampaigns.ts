"use client";

import { useCallback, useEffect, useState } from "react";
import type { Campaign, SharedCampaignCharacters } from "@/interfaces/Campaign";
import { fetchCampaigns, fetchSharedCharacters } from "@/utils/campaigns";
import { useAuth } from "@/components/auth/AuthProvider";

/**
 * The signed-in user's campaigns (empty and not loading while signed out -
 * campaigns need an account). `reload()` re-fetches, `setCampaigns` lets a
 * page apply the result of its own mutation without a round trip.
 */
export function useCampaigns() {
    const { status } = useAuth();
    const [campaigns, setCampaigns] = useState<Campaign[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    const reload = useCallback(async () => {
        try {
            setCampaigns(await fetchCampaigns());
            setError(null);
        } catch (err) {
            setError((err as Error).message);
            setCampaigns((current) => current ?? []);
        }
    }, []);

    useEffect(() => {
        if (status === "authenticated") void reload();
        else if (status === "anonymous") setCampaigns([]);
    }, [status, reload]);

    return {
        campaigns: campaigns ?? [],
        loading: status === "loading" || (status === "authenticated" && campaigns === null),
        error,
        reload,
        setCampaigns: (next: Campaign[]) => setCampaigns(next),
    };
}

/** Other members' characters, grouped by campaign, for /home. Always online-only (nothing cached locally). */
export function useSharedCharacters() {
    const { status } = useAuth();
    const [groups, setGroups] = useState<SharedCampaignCharacters[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (status !== "authenticated") {
            setGroups(status === "anonymous" ? [] : null);
            return;
        }
        let cancelled = false;
        fetchSharedCharacters()
            .then((result) => {
                if (cancelled) return;
                setGroups(result);
                setError(null);
            })
            .catch((err) => {
                if (cancelled) return;
                setGroups([]);
                setError((err as Error).message);
            });
        return () => {
            cancelled = true;
        };
    }, [status]);

    return { groups: groups ?? [], loading: groups === null, error };
}
