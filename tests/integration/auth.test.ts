import { beforeEach, describe, expect, it, vi } from "vitest";
import { collections } from "@/server/db";
import { hashToken, SESSION_COOKIE } from "@/server/auth";
import { sendMail } from "@/server/mailer";
import { call, createBrowser, registerUser, signIn, TEST_PASSWORD } from "./helpers/api";

// Capture outgoing email instead of printing it - the reset link is read from here.
vi.mock("@/server/mailer", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/server/mailer")>()),
  sendMail: vi.fn(async () => undefined),
}));

const sendMailMock = vi.mocked(sendMail);

type UserBody = { user: { id: string; email: string; displayName: string; createdAt: string } | null };

async function me(browser: ReturnType<typeof createBrowser>) {
  return (await call<UserBody>("/api/auth/me", { browser })).body.user;
}

/** Requests a reset email and returns the token from the link in it. */
async function requestResetToken(email: string): Promise<string> {
  sendMailMock.mockClear();
  const result = await call("/api/auth/forgot-password", { body: { email } });
  expect(result.status).toBe(200);
  expect(sendMailMock).toHaveBeenCalledTimes(1);
  const { text } = sendMailMock.mock.calls[0][0];
  const token = text.match(/reset-password\?token=([^\s]+)/)?.[1];
  if (!token) throw new Error(`no reset link in email:\n${text}`);
  return decodeURIComponent(token);
}

beforeEach(() => {
  sendMailMock.mockReset();
  sendMailMock.mockResolvedValue(undefined);
});

describe("POST /api/auth/register", () => {
  it("creates the account, signs the browser in and never returns the password hash", async () => {
    const browser = createBrowser();
    const result = await call<UserBody>("/api/auth/register", {
      browser,
      body: { email: "  Frodo@Shire.example ", password: TEST_PASSWORD, displayName: "  Frodo  " },
    });

    expect(result.status).toBe(201);
    expect(result.body.user).toEqual({
      id: expect.any(String),
      email: "frodo@shire.example",
      displayName: "Frodo",
      createdAt: expect.any(String),
    });
    expect(JSON.stringify(result.body)).not.toMatch(/passwordHash|\$2[aby]\$/);
    expect(result.response.headers.get("cache-control")).toBe("no-store");

    // httpOnly session cookie, and only its hash is stored server-side.
    const token = browser.cookies.get(SESSION_COOKIE);
    expect(token).toBeTruthy();
    expect(browser.cookieOptions.get(SESSION_COOKIE)).toMatchObject({ httpOnly: true, sameSite: "lax", path: "/" });
    const { sessions, users } = await collections();
    expect(await sessions.findOne({ tokenHash: hashToken(token!) })).not.toBeNull();
    expect(await sessions.findOne({ tokenHash: token })).toBeNull();

    const stored = await users.findOne({ email: "frodo@shire.example" });
    expect(stored?.passwordHash).toMatch(/^\$2[aby]\$/);
    expect(stored?.passwordHash).not.toContain(TEST_PASSWORD);

    expect(await me(browser)).toMatchObject({ email: "frodo@shire.example" });
  });

  it("defaults the display name to the part of the email before the @", async () => {
    const user = await registerUser(createBrowser(), "samwise@shire.example");
    expect(user.displayName).toBe("samwise");
  });

  it("rejects a duplicate email regardless of case with 409", async () => {
    await registerUser(createBrowser(), "pippin@shire.example");
    const result = await call("/api/auth/register", { body: { email: "PIPPIN@shire.example", password: TEST_PASSWORD } });
    expect(result.status).toBe(409);
    expect(result.body.error).toMatch(/already exists/);
  });

  it.each([
    ["an invalid email", { email: "not-an-email", password: TEST_PASSWORD }, /valid email/],
    ["a missing password", { email: "a@b.example" }, /required/],
    ["a too-short password", { email: "a@b.example", password: "short" }, /at least 8/],
    ["a too-long password", { email: "a@b.example", password: "x".repeat(129) }, /at most 128/],
  ])("rejects %s with 400", async (_label, body, message) => {
    const result = await call("/api/auth/register", { body });
    expect(result.status).toBe(400);
    expect(result.body.error).toMatch(message);
  });

  it("turns a malformed JSON body into a 400 instead of a 500", async () => {
    const result = await call("/api/auth/register", { body: "{not json" });
    expect(result.status).toBe(400);
    expect(result.body.error).toBe("Invalid JSON body.");
  });

  it("rejects cross-origin requests with 403", async () => {
    const result = await call("/api/auth/register", {
      body: { email: "evil@example.com", password: TEST_PASSWORD },
      headers: { origin: "https://evil.example" },
    });
    expect(result.status).toBe(403);
    const { users } = await collections();
    expect(await users.countDocuments()).toBe(0);
  });

  it("allows requests without an Origin header (curl, older browsers)", async () => {
    const result = await call("/api/auth/register", {
      body: { email: "curl@example.com", password: TEST_PASSWORD },
      headers: { origin: null },
    });
    expect(result.status).toBe(201);
  });

  it("rate-limits to 10 registrations per IP per hour", async () => {
    const browser = createBrowser();
    for (let i = 0; i < 10; i++) {
      const result = await call("/api/auth/register", { browser, body: { email: `bulk${i}@example.com`, password: TEST_PASSWORD } });
      expect(result.status).toBe(201);
    }
    const blocked = await call("/api/auth/register", { browser, body: { email: "bulk10@example.com", password: TEST_PASSWORD } });
    expect(blocked.status).toBe(429);
    expect(blocked.body.error).toMatch(/Too many attempts/);
  });
});

describe("GET /api/auth/me", () => {
  it("returns { user: null } (not 401) for an anonymous browser", async () => {
    const result = await call<UserBody>("/api/auth/me");
    expect(result.status).toBe(200);
    expect(result.body.user).toBeNull();
  });

  it("returns null for an unknown session token", async () => {
    const browser = createBrowser();
    browser.cookies.set(SESSION_COOKIE, "forged-token");
    expect(await me(browser)).toBeNull();
  });

  it("treats an expired session as signed out and deletes it", async () => {
    const browser = createBrowser();
    await registerUser(browser);
    const { sessions } = await collections();
    await sessions.updateMany({}, { $set: { expiresAt: new Date(Date.now() - 1000) } });

    expect(await me(browser)).toBeNull();
    expect(await sessions.countDocuments()).toBe(0);
  });
});

describe("POST /api/auth/login and /logout", () => {
  let email: string;

  beforeEach(async () => {
    email = (await registerUser(createBrowser(), "gandalf@istari.example")).email;
  });

  it("signs in with the right password (email is case/whitespace-insensitive)", async () => {
    const browser = createBrowser();
    const result = await call<UserBody>("/api/auth/login", { browser, body: { email: " GANDALF@istari.example", password: TEST_PASSWORD } });
    expect(result.status).toBe(200);
    expect(result.body.user?.email).toBe(email);
    expect(await me(browser)).toMatchObject({ email });
  });

  it("gives the same 401 message for a wrong password and an unknown email", async () => {
    const wrongPassword = await call("/api/auth/login", { body: { email, password: "wrong password!" } });
    const unknownEmail = await call("/api/auth/login", { body: { email: "nobody@example.com", password: TEST_PASSWORD } });
    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body.error).toBe(unknownEmail.body.error);
  });

  it("asks for both fields when one is missing", async () => {
    const result = await call("/api/auth/login", { body: { email } });
    expect(result.status).toBe(400);
  });

  it("locks out an email+IP after 10 attempts, and a successful login resets the count", async () => {
    const browser = createBrowser();
    for (let i = 0; i < 9; i++) {
      expect((await call("/api/auth/login", { browser, body: { email, password: "nope nope" } })).status).toBe(401);
    }
    // The 10th attempt succeeds and clears the counter...
    expect((await call("/api/auth/login", { browser, body: { email, password: TEST_PASSWORD } })).status).toBe(200);
    // ...so 10 more failures are allowed before the 11th is blocked.
    for (let i = 0; i < 10; i++) {
      expect((await call("/api/auth/login", { browser, body: { email, password: "nope nope" } })).status).toBe(401);
    }
    const blocked = await call("/api/auth/login", { browser, body: { email, password: TEST_PASSWORD } });
    expect(blocked.status).toBe(429);
  });

  it("logout deletes this session only and clears the cookie", async () => {
    const laptop = await signIn(email);
    const phone = await signIn(email);

    const result = await call("/api/auth/logout", { browser: laptop, method: "POST" });
    expect(result.status).toBe(200);
    expect(laptop.cookies.has(SESSION_COOKIE)).toBe(false);
    expect(await me(laptop)).toBeNull();
    expect(await me(phone)).toMatchObject({ email });
  });

  it("logout succeeds even when not signed in", async () => {
    expect((await call("/api/auth/logout", { method: "POST" })).status).toBe(200);
  });
});

describe("POST /api/auth/change-password", () => {
  it("requires a signed-in user", async () => {
    const result = await call("/api/auth/change-password", { body: { currentPassword: "x", newPassword: "y" } });
    expect(result.status).toBe(401);
  });

  it("rejects a wrong current password", async () => {
    const browser = createBrowser();
    await registerUser(browser);
    const result = await call("/api/auth/change-password", {
      browser,
      body: { currentPassword: "not my password", newPassword: "brand new password" },
    });
    expect(result.status).toBe(400);
    expect(result.body.error).toMatch(/current password is incorrect/);
  });

  it("validates the new password", async () => {
    const browser = createBrowser();
    await registerUser(browser);
    const result = await call("/api/auth/change-password", { browser, body: { currentPassword: TEST_PASSWORD, newPassword: "short" } });
    expect(result.status).toBe(400);
    expect(result.body.error).toMatch(/at least 8/);
  });

  it("changes the password, signs out every other device and keeps this one signed in", async () => {
    const laptop = createBrowser();
    const { email } = await registerUser(laptop);
    const phone = await signIn(email);

    const result = await call("/api/auth/change-password", {
      browser: laptop,
      body: { currentPassword: TEST_PASSWORD, newPassword: "a much better password" },
    });
    expect(result.status).toBe(200);

    expect(await me(laptop)).toMatchObject({ email });
    expect(await me(phone)).toBeNull();
    expect((await call("/api/auth/login", { body: { email, password: TEST_PASSWORD } })).status).toBe(401);
    expect((await call("/api/auth/login", { body: { email, password: "a much better password" } })).status).toBe(200);

    const { users } = await collections();
    expect((await users.findOne({ email }))?.passwordChangedAt).toBeInstanceOf(Date);
  });
});

describe("password reset (forgot-password + reset-password)", () => {
  let email: string;

  beforeEach(async () => {
    email = (await registerUser(createBrowser(), "aragorn@gondor.example")).email;
  });

  it("answers the same for unknown emails and sends nothing", async () => {
    const result = await call("/api/auth/forgot-password", { body: { email: "nobody@example.com" } });
    expect(result.status).toBe(200);
    expect(result.body).toEqual({ ok: true });
    expect(sendMailMock).not.toHaveBeenCalled();
  });

  it("rejects an invalid email address", async () => {
    expect((await call("/api/auth/forgot-password", { body: { email: "nope" } })).status).toBe(400);
  });

  it("emails a single-use link built from the request's own origin", async () => {
    await call("/api/auth/forgot-password", { body: { email } });
    expect(sendMailMock).toHaveBeenCalledTimes(1);
    const mail = sendMailMock.mock.calls[0][0];
    expect(mail.to).toBe(email);
    expect(mail.text).toMatch(/http:\/\/localhost:3000\/reset-password\?token=/);
    expect(mail.text).toMatch(/valid for 60 minutes/);

    // Only the token's hash is stored.
    const { passwordResets } = await collections();
    const token = decodeURIComponent(mail.text.match(/token=([^\s]+)/)![1]);
    expect(await passwordResets.findOne({ tokenHash: hashToken(token) })).not.toBeNull();
  });

  it("uses APP_URL for the link when it's set", async () => {
    process.env.APP_URL = "https://sheets.example.com/";
    try {
      await call("/api/auth/forgot-password", { body: { email } });
      expect(sendMailMock.mock.calls[0][0].text).toMatch(/https:\/\/sheets\.example\.com\/reset-password\?token=/);
    } finally {
      delete process.env.APP_URL;
    }
  });

  it("returns 502 when the email can't be sent", async () => {
    sendMailMock.mockRejectedValueOnce(new Error("SMTP down"));
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const result = await call("/api/auth/forgot-password", { body: { email } });
    expect(result.status).toBe(502);
  });

  it("limits reset emails to 3 per address per 15 minutes", async () => {
    for (let i = 0; i < 3; i++) expect((await call("/api/auth/forgot-password", { body: { email } })).status).toBe(200);
    expect((await call("/api/auth/forgot-password", { body: { email } })).status).toBe(429);
  });

  it("GET reports whether a token is still valid", async () => {
    const token = await requestResetToken(email);
    const valid = await call<{ valid: boolean }>(`/api/auth/reset-password?token=${encodeURIComponent(token)}`);
    expect(valid.body.valid).toBe(true);

    const bogus = await call<{ valid: boolean }>(`/api/auth/reset-password?token=${"x".repeat(43)}`);
    expect(bogus.body.valid).toBe(false);
    const missing = await call<{ valid: boolean }>("/api/auth/reset-password");
    expect(missing.body.valid).toBe(false);
  });

  it("resets the password, revokes every session, signs this browser in and burns the token", async () => {
    const oldDevice = await signIn(email);
    const token = await requestResetToken(email);

    const browser = createBrowser();
    const result = await call<UserBody>("/api/auth/reset-password", { browser, body: { token, password: "the new password" } });
    expect(result.status).toBe(200);
    expect(result.body.user?.email).toBe(email);

    expect(await me(browser)).toMatchObject({ email });
    expect(await me(oldDevice)).toBeNull();
    expect((await call("/api/auth/login", { body: { email, password: TEST_PASSWORD } })).status).toBe(401);
    expect((await call("/api/auth/login", { body: { email, password: "the new password" } })).status).toBe(200);

    const reuse = await call("/api/auth/reset-password", { body: { token, password: "yet another password" } });
    expect(reuse.status).toBe(400);
    expect(reuse.body.error).toMatch(/invalid or has expired/);
  });

  it("only the newest link works", async () => {
    const first = await requestResetToken(email);
    const second = await requestResetToken(email);
    expect((await call("/api/auth/reset-password", { body: { token: first, password: "the new password" } })).status).toBe(400);
    expect((await call("/api/auth/reset-password", { body: { token: second, password: "the new password" } })).status).toBe(200);
  });

  it("rejects an expired token", async () => {
    const token = await requestResetToken(email);
    const { passwordResets } = await collections();
    await passwordResets.updateMany({}, { $set: { expiresAt: new Date(Date.now() - 1000) } });
    const result = await call("/api/auth/reset-password", { body: { token, password: "the new password" } });
    expect(result.status).toBe(400);
  });

  it("validates the new password before touching the token", async () => {
    const token = await requestResetToken(email);
    expect((await call("/api/auth/reset-password", { body: { token, password: "short" } })).status).toBe(400);
    // Token is still usable afterwards.
    expect((await call("/api/auth/reset-password", { body: { token, password: "long enough now" } })).status).toBe(200);
  });
});
