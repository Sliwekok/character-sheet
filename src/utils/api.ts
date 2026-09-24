/**
 * Thin `fetch` wrapper for the app's own `/api/*` routes: JSON in, JSON
 * out, and non-2xx responses turned into an `ApiError` carrying the
 * server's `{ error }` message so UI code can show it directly.
 */

export class ApiError extends Error {
    constructor(public status: number, message: string) {
        super(message);
    }
}

type Method = "GET" | "POST" | "PUT" | "DELETE";

export async function apiFetch<T>(path: string, options: { method?: Method; body?: unknown; signal?: AbortSignal } = {}): Promise<T> {
    let response: Response;
    try {
        response = await fetch(path, {
            method: options.method ?? "GET",
            credentials: "same-origin",
            cache: "no-store",
            headers: options.body !== undefined ? { "Content-Type": "application/json" } : undefined,
            body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
            signal: options.signal,
        });
    } catch (error) {
        if ((error as Error)?.name === "AbortError") throw error;
        // status 0 = never reached the server (offline, server down, DNS...).
        throw new ApiError(0, "Can't reach the server. Check your connection and try again.");
    }

    let data: unknown = null;
    try {
        data = await response.json();
    } catch {
        // empty/non-JSON body
    }

    if (!response.ok) {
        const message =
            (data && typeof data === "object" && "error" in data && typeof (data as { error: unknown }).error === "string"
                ? (data as { error: string }).error
                : null) ?? `Request failed (${response.status}).`;
        throw new ApiError(response.status, message);
    }

    return data as T;
}
