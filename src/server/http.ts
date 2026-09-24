import "server-only";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

/** Small helpers shared by every `app/api` route handler. */

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function json<T>(body: T, init?: number | ResponseInit): NextResponse {
  const responseInit = typeof init === "number" ? { status: init } : init;
  return NextResponse.json(body, {
    ...responseInit,
    headers: { "Cache-Control": "no-store", ...(responseInit?.headers ?? {}) },
  });
}

export function errorResponse(status: number, message: string): NextResponse {
  return json({ error: message }, status);
}

/** Parses a JSON body, turning malformed input into a 400 instead of a 500. */
export async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = await request.json();
    if (body && typeof body === "object" && !Array.isArray(body)) return body as Record<string, unknown>;
  } catch {
    // fall through
  }
  throw new HttpError(400, "Invalid JSON body.");
}

/**
 * Rejects cross-site state-changing requests. The session cookie is
 * `SameSite=Lax` already (browsers won't send it on a cross-site POST), and
 * this is the second layer: if the browser sent an `Origin`, it has to
 * match the host the request came in on.
 */
export async function assertSameOrigin(): Promise<void> {
  const h = await headers();
  const origin = h.get("origin");
  if (!origin) return; // same-origin fetches from older browsers / curl
  const host = h.get("x-forwarded-host") ?? h.get("host");
  try {
    if (new URL(origin).host === host) return;
  } catch {
    // fall through
  }
  throw new HttpError(403, "Cross-origin request rejected.");
}

export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
}

/** Base URL for links in emails - `APP_URL` if set, otherwise the request's own origin. */
export async function appBaseUrl(): Promise<string> {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/+$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/**
 * Wraps a route handler so thrown `HttpError`s become proper JSON error
 * responses and anything unexpected becomes a logged 500 (without leaking
 * the stack to the client).
 */
export function handler<Args extends unknown[]>(
  fn: (...args: Args) => Promise<Response>
): (...args: Args) => Promise<Response> {
  return async (...args: Args) => {
    try {
      return await fn(...args);
    } catch (error) {
      if (error instanceof HttpError) return errorResponse(error.status, error.message);
      console.error("[api] unexpected error:", error);
      return errorResponse(500, "Something went wrong on the server. Please try again.");
    }
  };
}
