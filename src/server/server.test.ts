import { afterEach, describe, expect, it, vi } from "vitest";
import { hashToken, isValidEmail, normalizeEmail, generateToken, validatePassword } from "./auth";
import { assertCharacterId } from "./characters";
import { HttpError, readJson } from "./http";
import { passwordResetMail } from "./mailer";
import { rateLimit, resetRateLimit } from "./rateLimit";

/** Pure helpers from src/server - the DB-backed parts are covered in tests/integration. */

describe("auth helpers", () => {
  it("normalizes emails to trimmed lowercase and anything else to ''", () => {
    expect(normalizeEmail("  Bob@Example.COM ")).toBe("bob@example.com");
    expect(normalizeEmail(undefined)).toBe("");
    expect(normalizeEmail(42)).toBe("");
  });

  it.each([
    ["a@b.co", true],
    ["first.last+tag@sub.example.org", true],
    ["no-at-sign.example", false],
    ["two@@example.com", false],
    ["spaces in@example.com", false],
    ["missing@tld", false],
    [`${"a".repeat(250)}@b.co`, false],
  ])("isValidEmail(%j) is %s", (email, expected) => {
    expect(isValidEmail(email)).toBe(expected);
  });

  it("validates password length and type", () => {
    expect(validatePassword(undefined)).toBe("Password is required.");
    expect(validatePassword("1234567")).toMatch(/at least 8/);
    expect(validatePassword("12345678")).toBeNull();
    expect(validatePassword("x".repeat(128))).toBeNull();
    expect(validatePassword("x".repeat(129))).toMatch(/at most 128/);
  });

  it("generates unique url-safe tokens and hashes them deterministically", () => {
    const a = generateToken();
    const b = generateToken();
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(hashToken(a)).toBe(hashToken(a));
    expect(hashToken(a)).toMatch(/^[0-9a-f]{64}$/);
    expect(hashToken(a)).not.toBe(hashToken(b));
  });
});

describe("assertCharacterId", () => {
  it.each(["abc", "0b7c1f7e-3c55-4b44-9e0c-1c6ad3e2a111", "char-lz3k_x9"])("accepts %j", (id) => {
    expect(() => assertCharacterId(id)).not.toThrow();
  });

  it.each(["", "has space", "slash/es", "x".repeat(101), 123, null])("rejects %j with a 400", (id) => {
    try {
      assertCharacterId(id);
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(HttpError);
      expect((error as HttpError).status).toBe(400);
    }
  });
});

describe("readJson", () => {
  const request = (body: string) => new Request("http://localhost/api", { method: "POST", body });

  it("returns a JSON object body", async () => {
    await expect(readJson(request('{"a":1}'))).resolves.toEqual({ a: 1 });
  });

  it.each(["not json", "[1,2]", "null", '"string"'])("rejects %j as a 400", async (body) => {
    await expect(readJson(request(body))).rejects.toMatchObject({ status: 400, message: "Invalid JSON body." });
  });
});

describe("rateLimit", () => {
  afterEach(() => {
    vi.useRealTimers();
    resetRateLimit("test-key");
  });

  it("allows `limit` hits per window, then throws a 429 with the minutes left", () => {
    vi.useFakeTimers();
    for (let i = 0; i < 3; i++) rateLimit("test-key", 3, 10 * 60_000);
    expect(() => rateLimit("test-key", 3, 10 * 60_000)).toThrowError(
      expect.objectContaining({ status: 429, message: "Too many attempts. Try again in 10 minutes." })
    );
  });

  it("says '1 minute' (singular) near the end of the window", () => {
    vi.useFakeTimers();
    rateLimit("test-key", 1, 60_000);
    vi.advanceTimersByTime(30_000);
    expect(() => rateLimit("test-key", 1, 60_000)).toThrow("Try again in 1 minute.");
  });

  it("starts a fresh window once the old one expires", () => {
    vi.useFakeTimers();
    rateLimit("test-key", 1, 60_000);
    vi.advanceTimersByTime(60_000);
    expect(() => rateLimit("test-key", 1, 60_000)).not.toThrow();
  });

  it("resetRateLimit clears the count", () => {
    rateLimit("test-key", 1, 60_000);
    resetRateLimit("test-key");
    expect(() => rateLimit("test-key", 1, 60_000)).not.toThrow();
  });
});

describe("passwordResetMail", () => {
  it("includes the link in both text and html, and escapes the display name in html", () => {
    const mail = passwordResetMail("a@b.co", '<script>alert("x")</script>', "https://app.example/reset?token=a&b", 60);
    expect(mail.to).toBe("a@b.co");
    expect(mail.text).toContain("https://app.example/reset?token=a&b");
    expect(mail.text).toContain("valid for 60 minutes");
    expect(mail.html).not.toContain("<script>");
    expect(mail.html).toContain("&lt;script&gt;");
    expect(mail.html).toContain("https://app.example/reset?token=a&amp;b");
  });

  it("falls back to 'adventurer' without a display name", () => {
    expect(passwordResetMail("a@b.co", "", "https://x", 60).text).toMatch(/^Hi adventurer,/);
  });
});
