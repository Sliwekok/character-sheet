"use client";

import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { StoredCharacter } from "@/interfaces/StoredCharacter";
import { CHARACTERS_CHANGED_EVENT, CharactersChangedDetail, loadCharacter, loadCharacters } from "@/utils/storage";
import { fetchCharacterFromServer } from "@/utils/sync";
import { useAuth, useSyncStatus } from "./AuthProvider";

/**
 * Local-first lookup of one character by id, for the character sheet and
 * the edit wizard:
 *
 * 1. localStorage has it -> returned immediately (no network).
 * 2. It isn't here, and the player is signed in -> fetched from the server
 *    (and saved locally), with `undefined` ("still loading") meanwhile so
 *    the page can show its skeleton.
 * 3. Not here and signed out (or the server doesn't have it either) -> null.
 *
 * Also follows changes: when sync writes a newer version of this character
 * (edited on another device) or deletes it, the returned value updates.
 * Local edits made through the returned setter are left alone - the page
 * that made them already has the new value.
 *
 * `undefined` = loading, `null` = not found.
 */
export function useStoredCharacter(
    id: string | null | undefined
): [StoredCharacter | null | undefined, Dispatch<SetStateAction<StoredCharacter | null | undefined>>] {
    const { status } = useAuth();
    const [character, setCharacter] = useState<StoredCharacter | null | undefined>(undefined);

    useEffect(() => {
        if (!id) {
            setCharacter(null);
            return;
        }

        const local = loadCharacter(id);
        if (local) {
            setCharacter(local);
            return;
        }

        if (status === "loading") {
            setCharacter(undefined); // wait until we know whether there's a session
            return;
        }
        if (status === "anonymous") {
            setCharacter(null);
            return;
        }

        let cancelled = false;
        setCharacter(undefined);
        fetchCharacterFromServer(id)
            .then((remote) => !cancelled && setCharacter(remote ?? loadCharacter(id) ?? null))
            .catch(() => !cancelled && setCharacter(loadCharacter(id) ?? null));
        return () => {
            cancelled = true;
        };
    }, [id, status]);

    useEffect(() => {
        if (!id) return;
        function handleChange(event: Event) {
            const detail = (event as CustomEvent<CharactersChangedDetail>).detail;
            if (detail.source !== "remote" || !detail.ids.includes(id!)) return;
            setCharacter(loadCharacter(id!) ?? null);
        }
        window.addEventListener(CHARACTERS_CHANGED_EVENT, handleChange);
        return () => window.removeEventListener(CHARACTERS_CHANGED_EVENT, handleChange);
    }, [id]);

    return [character, setCharacter];
}

/**
 * Local-first character list for /home: localStorage right away, kept in
 * sync with every later change (local or from the server). `loading` is
 * true only when there's nothing local to show yet AND a server download
 * that could fill the list is still pending - i.e. exactly when a skeleton
 * is more honest than an empty list.
 */
export function useStoredCharacters(): { characters: StoredCharacter[] | null; loading: boolean } {
    const { status } = useAuth();
    const sync = useSyncStatus();
    const [characters, setCharacters] = useState<StoredCharacter[] | null>(null);

    useEffect(() => {
        setCharacters(loadCharacters());
        const reload = () => setCharacters(loadCharacters());
        window.addEventListener(CHARACTERS_CHANGED_EVENT, reload);
        return () => window.removeEventListener(CHARACTERS_CHANGED_EVENT, reload);
    }, []);

    const empty = characters !== null && characters.length === 0;
    const waitingForServer = status === "loading" || (status === "authenticated" && !sync.initialPullDone);
    return { characters, loading: characters === null || (empty && waitingForServer) };
}
