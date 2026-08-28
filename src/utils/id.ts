/**
 * Generates a unique id for a stored character. Prefers `crypto.randomUUID`
 * (available in every modern browser this app targets) and falls back to a
 * timestamp+random string so this still works in an environment where it's
 * missing (e.g. an older test runner) rather than throwing.
 */
export function generateId(): string {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }

    return `char-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
