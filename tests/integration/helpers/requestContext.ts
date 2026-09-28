/**
 * The "current request" the mocked `next/headers` module reads from (see
 * ../setup.ts). Kept on globalThis so the mock factory and the test file
 * always see the same object, whatever module instance each one got.
 */

export interface FakeBrowser {
  /** Cookies this browser would send - route handlers read and write it via `cookies()`. */
  cookies: Map<string, string>;
  /** Options passed to the last `cookies().set(name, ...)` - lets tests assert httpOnly/sameSite. */
  cookieOptions: Map<string, Record<string, unknown>>;
  /** Value of the `x-forwarded-for` header, i.e. the client IP the rate limiter sees. */
  ip: string;
  userAgent: string;
}

export interface RequestContext {
  headers: Headers;
  browser: FakeBrowser;
}

const g = globalThis as typeof globalThis & { __testRequest?: RequestContext };

export function setCurrentRequest(context: RequestContext): void {
  g.__testRequest = context;
}

export function currentRequest(): RequestContext {
  if (!g.__testRequest) throw new Error("next/headers used outside a test request - call it through helpers/api.ts");
  return g.__testRequest;
}
