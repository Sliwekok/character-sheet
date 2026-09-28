import { describe, expect, it, vi } from "vitest";
import { GET } from "./route";

/** The D&D Beyond proxy route, with the upstream `fetch` stubbed out. */

async function get(id: string) {
  const response = await GET(new Request(`http://localhost:3000/api/dndbeyond/${id}`), { params: Promise.resolve({ id }) });
  return { status: response.status, body: await response.json() };
}

function upstream(response: Response | Error) {
  const fetchMock = vi.fn(async () => {
    if (response instanceof Error) throw response;
    return response;
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

describe("GET /api/dndbeyond/:id", () => {
  it("rejects non-numeric ids without calling D&D Beyond", async () => {
    const fetchMock = upstream(jsonResponse({}));
    const result = await get("abc123");
    expect(result.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns the character data on success", async () => {
    const fetchMock = upstream(jsonResponse({ success: true, data: { id: 42, name: "Tordek" } }));
    const result = await get("42");
    expect(result).toEqual({ status: 200, body: { data: { id: 42, name: "Tordek" } } });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://character-service.dndbeyond.com/character/v5/character/42",
      expect.objectContaining({ cache: "no-store" })
    );
  });

  it("maps a network failure to 502 with a friendly message", async () => {
    upstream(new TypeError("fetch failed"));
    const result = await get("42");
    expect(result.status).toBe(502);
    expect(result.body.error).toMatch(/Couldn't reach D&D Beyond/);
  });

  it("maps an upstream 404 to 404", async () => {
    upstream(jsonResponse({}, 404));
    const result = await get("42");
    expect(result.status).toBe(404);
    expect(result.body.error).toMatch(/No D&D Beyond character found with id 42/);
  });

  it("maps other upstream errors (e.g. a private character) to 502 and mentions sharing", async () => {
    upstream(jsonResponse({}, 403));
    const result = await get("42");
    expect(result.status).toBe(502);
    expect(result.body.error).toMatch(/HTTP 403/);
    expect(result.body.error).toMatch(/Public/);
  });

  it("reports a non-JSON upstream body", async () => {
    upstream(new Response("<html>oops</html>", { status: 200 }));
    const result = await get("42");
    expect(result.status).toBe(502);
    expect(result.body.error).toMatch(/wasn't valid JSON/);
  });

  it("passes D&D Beyond's own message through when success is false", async () => {
    upstream(jsonResponse({ success: false, message: "Character is private" }));
    const result = await get("42");
    expect(result).toEqual({ status: 404, body: { error: "Character is private" } });
  });

  it("falls back to a generic message when success is false without one", async () => {
    upstream(jsonResponse({ success: true }));
    const result = await get("42");
    expect(result.status).toBe(404);
    expect(result.body.error).toMatch(/didn't return character data/);
  });
});
