import { FakeBrowser, setCurrentRequest } from "./requestContext";

import * as registerRoute from "@/app/api/auth/register/route";
import * as loginRoute from "@/app/api/auth/login/route";
import * as logoutRoute from "@/app/api/auth/logout/route";
import * as meRoute from "@/app/api/auth/me/route";
import * as changePasswordRoute from "@/app/api/auth/change-password/route";
import * as forgotPasswordRoute from "@/app/api/auth/forgot-password/route";
import * as resetPasswordRoute from "@/app/api/auth/reset-password/route";
import * as charactersRoute from "@/app/api/characters/route";
import * as characterRoute from "@/app/api/characters/[id]/route";

export const APP_ORIGIN = "http://localhost:3000";

let ipCounter = 0;

/** A browser with its own cookie jar (and IP, so rate limits don't bleed between browsers). */
export function createBrowser(overrides: Partial<FakeBrowser> = {}): FakeBrowser {
  ipCounter += 1;
  return {
    cookies: new Map(),
    cookieOptions: new Map(),
    ip: `10.0.0.${ipCounter}`,
    userAgent: "vitest-browser",
    ...overrides,
  };
}

type Method = "GET" | "POST" | "PUT" | "DELETE";
type RouteModule = Partial<Record<Method, (request: Request, context: { params: Promise<Record<string, string>> }) => Promise<Response>>>;

/**
 * Which route module serves a path - a tiny stand-in for Next's file-system
 * router, covering the app's own /api routes.
 */
function resolveRoute(pathname: string): { route: RouteModule; params: Record<string, string> } {
  const staticRoutes: Record<string, RouteModule> = {
    "/api/auth/register": registerRoute,
    "/api/auth/login": loginRoute,
    "/api/auth/logout": logoutRoute,
    "/api/auth/me": meRoute,
    "/api/auth/change-password": changePasswordRoute,
    "/api/auth/forgot-password": forgotPasswordRoute,
    "/api/auth/reset-password": resetPasswordRoute,
    "/api/characters": charactersRoute,
  };
  if (staticRoutes[pathname]) return { route: staticRoutes[pathname], params: {} };

  const character = pathname.match(/^\/api\/characters\/([^/]+)$/);
  if (character) return { route: characterRoute as RouteModule, params: { id: decodeURIComponent(character[1]) } };

  throw new Error(`No test route for ${pathname}`);
}

export interface CallOptions {
  method?: Method;
  /** Serialized as JSON. Pass a string to send it raw (e.g. malformed JSON). */
  body?: unknown;
  browser?: FakeBrowser;
  /** Extra/overriding request headers, e.g. `{ origin: "https://evil.example" }`. Use `null` to drop a default header. */
  headers?: Record<string, string | null>;
}

export interface CallResult<T = Record<string, unknown>> {
  status: number;
  body: T;
  response: Response;
}

/**
 * Sends one request through the real route handler, as `browser`. A POST/
 * PUT/DELETE carries a same-origin `Origin` header by default, like a
 * browser `fetch` from the app's own pages would.
 */
export async function call<T = Record<string, unknown>>(path: string, options: CallOptions = {}): Promise<CallResult<T>> {
  const method = options.method ?? (options.body === undefined ? "GET" : "POST");
  const browser = options.browser ?? createBrowser();
  const url = new URL(path, APP_ORIGIN);

  const headerEntries: Record<string, string | null> = {
    host: url.host,
    "user-agent": browser.userAgent,
    "x-forwarded-for": browser.ip,
    ...(method !== "GET" ? { origin: APP_ORIGIN } : {}),
    ...(options.body !== undefined ? { "content-type": "application/json" } : {}),
    ...options.headers,
  };
  const headers = new Headers();
  for (const [name, value] of Object.entries(headerEntries)) if (value !== null) headers.set(name, value);

  const request = new Request(url, {
    method,
    headers,
    body: options.body === undefined ? undefined : typeof options.body === "string" ? options.body : JSON.stringify(options.body),
  });

  const { route, params } = resolveRoute(url.pathname);
  const fn = route[method];
  if (!fn) throw new Error(`${method} not exported by the route for ${url.pathname}`);

  setCurrentRequest({ headers, browser });
  const response = await fn(request, { params: Promise.resolve(params) });
  const text = await response.clone().text();
  return { status: response.status, body: (text ? JSON.parse(text) : null) as T, response };
}

/**
 * A `fetch` replacement that serves the app's relative `/api/*` URLs from
 * the real route handlers as `browser` - lets client code (utils/api.ts,
 * utils/sync.ts) run end-to-end against the real backend.
 */
export function createFetch(browser: FakeBrowser): typeof fetch {
  return (async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    const method = (init.method ?? "GET").toUpperCase() as Method;
    const body = typeof init.body === "string" ? init.body : undefined;
    const { response } = await call(url, { method, body, browser });
    return response;
  }) as typeof fetch;
}

export const TEST_PASSWORD = "correct horse battery";

/** Registers a user as `browser` (which ends up signed in) and returns the public user. */
export async function registerUser(
  browser: FakeBrowser,
  email = `player${++ipCounter}@example.com`,
  password = TEST_PASSWORD
): Promise<{ id: string; email: string; displayName: string }> {
  const result = await call<{ user: { id: string; email: string; displayName: string } }>("/api/auth/register", {
    browser,
    body: { email, password },
  });
  if (result.status !== 201) throw new Error(`register failed: ${result.status} ${JSON.stringify(result.body)}`);
  return result.body.user;
}

/** A second signed-in browser for the same account ("another device"). */
export async function signIn(email: string, password = TEST_PASSWORD): Promise<FakeBrowser> {
  const browser = createBrowser();
  const result = await call("/api/auth/login", { browser, body: { email, password } });
  if (result.status !== 200) throw new Error(`login failed: ${result.status} ${JSON.stringify(result.body)}`);
  return browser;
}
