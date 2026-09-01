import { StoredCharacter } from "@/interfaces/StoredCharacter";
import { AbilityScores } from "@/interfaces/Characters";
import { generateId } from "@/utils/id";

const ABILITY_KEYS: (keyof AbilityScores)[] = [
    "strength",
    "dexterity",
    "constitution",
    "intelligence",
    "wisdom",
    "charisma",
];

/** Turns a character's name into a filesystem-safe filename stem, e.g. "Aria Nightshade" -> "aria-nightshade". Falls back to "character" if nothing usable is left (an empty/punctuation-only name). */
function slugifyName(name: string): string {
    const slug = name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    return slug || "character";
}

/** Filename an exported character is saved under. */
export function exportFilename(character: StoredCharacter): string {
    return `${slugifyName(character.name)}.json`;
}

/**
 * Pretty-printed JSON of a stored character - exactly the same shape
 * `utils/storage.ts` already persists to `localStorage` (see that file's
 * header comment), just written to a downloadable file instead of the
 * browser's storage. Nothing is added or stripped for export, so an
 * exported file can be read back in by `parseImportedCharacter` below with
 * no loss.
 */
export function characterToJson(character: StoredCharacter): string {
    return JSON.stringify(character, null, 2);
}

/**
 * Triggers a browser download of `character` as a `.json` file. Pure
 * client-side, like the rest of this app's persistence - there's no
 * backend to send the file to (see utils/storage.ts), so this builds a
 * throwaway object URL for an invisible link and clicks it.
 */
export function downloadCharacterAsJson(character: StoredCharacter): void {
    const blob = new Blob([characterToJson(character)], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    try {
        const link = document.createElement("a");
        link.href = url;
        link.download = exportFilename(character);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } finally {
        URL.revokeObjectURL(url);
    }
}

/** Reads a `File` (e.g. from a file `<input>`) as text, promise-wrapped. */
export function readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result ?? ""));
        reader.onerror = () => reject(reader.error ?? new Error("Couldn't read that file."));
        reader.readAsText(file);
    });
}

export type ImportResult = { character: StoredCharacter } | { error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

/** True for anything with a non-blank `name` string - good enough to tell a real `{ name: "Fighter", ... }` reference object apart from junk, without re-validating every field the wizard already checked when the character was first built. */
function hasName(value: unknown): value is { name: string } {
    return isRecord(value) && typeof value.name === "string" && value.name.trim().length > 0;
}

/** True for a string `new Date(...)` can actually parse - guards against carrying a garbage `createdAt` forward from a hand-edited file. */
function isValidIsoDate(value: unknown): value is string {
    return typeof value === "string" && !Number.isNaN(new Date(value).getTime());
}

/**
 * Loose structural check that `data` is at least shaped like a
 * `StoredCharacter` - just enough to catch "this isn't a character export
 * at all" (the wrong file, empty JSON, a different app's save file, a
 * truncated download) without re-validating every game rule the wizard
 * already enforced when this character was first created. Anything that
 * passes this is trusted the same way a character loaded back out of
 * `localStorage` already is (see `utils/storage.ts`, which only checks
 * `Array.isArray` before trusting its JSON) - this app has never
 * re-validated game data beyond that.
 *
 * Returns a human-readable reason the file was rejected, or `null` if the
 * shape looks plausible.
 */
function findShapeError(data: unknown): string | null {
    if (!isRecord(data)) return "That file doesn't contain a character (expected a JSON object).";
    if (typeof data.name !== "string" || data.name.trim().length === 0) return "Missing character name.";
    if (data.edition !== "2014" && data.edition !== "2024") return "Missing or unrecognized edition.";
    if (typeof data.alignment !== "string" || data.alignment.length === 0) return "Missing alignment.";
    if (!hasName(data.race)) return "Missing race.";
    if (!hasName(data.background)) return "Missing background.";

    const classes = data.classes;
    if (!Array.isArray(classes) || classes.length === 0) return "Missing class.";
    for (const entry of classes) {
        if (!isRecord(entry) || !hasName(entry.class) || typeof entry.level !== "number") {
            return "One of the character's classes is missing its name or level.";
        }
    }

    const abilityScores = data.abilityScores;
    if (!isRecord(abilityScores) || !ABILITY_KEYS.every((key) => typeof abilityScores[key] === "number")) {
        return "Missing or invalid ability scores.";
    }

    if (!Array.isArray(data.feats)) return "Missing feats list.";
    if (!Array.isArray(data.skillProficiencies)) return "Missing skill proficiencies.";
    if (!Array.isArray(data.savingThrowProficiencies)) return "Missing saving throw proficiencies.";
    if (!Array.isArray(data.weapons)) return "Missing weapons list.";
    if (!isRecord(data.currency)) return "Missing currency.";
    if (!Array.isArray(data.spellsKnown)) return "Missing spells list.";
    if (!Array.isArray(data.languages)) return "Missing languages list.";
    if (typeof data.maxHP !== "number" || typeof data.currentHP !== "number") return "Missing hit points.";
    if (typeof data.initiative !== "number") return "Missing initiative.";

    return null;
}

/**
 * Parses and lightly validates a character export (see `findShapeError`).
 * On success, the id is always regenerated - this is reached from the "New
 * character" screen (see app/newCharacter/import), so an import always adds
 * a new character to the list rather than risking a silent overwrite of an
 * existing one that happens to share an id (e.g. re-importing a file
 * you've already imported once). `createdAt` is carried over when it's a
 * genuine date, so a character's original creation time survives being
 * exported and re-imported; `updatedAt` is left for `saveCharacter`
 * (utils/storage.ts) to stamp to now, same as any other save.
 */
export function parseImportedCharacter(raw: string): ImportResult {
    let data: unknown;
    try {
        data = JSON.parse(raw);
    } catch {
        return { error: "That file isn't valid JSON." };
    }

    const shapeError = findShapeError(data);
    if (shapeError) return { error: shapeError };

    const parsed = data as StoredCharacter;
    const now = new Date().toISOString();

    const character: StoredCharacter = {
        ...parsed,
        id: generateId(),
        createdAt: isValidIsoDate(parsed.createdAt) ? parsed.createdAt : now,
        updatedAt: now,
    };

    return { character };
}
