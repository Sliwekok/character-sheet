import { NextResponse } from "next/server";

const DDB_API_BASE = "https://character-service.dndbeyond.com/character/v5/character";

/**
 * Server-side proxy for D&D Beyond's unofficial character JSON endpoint
 * (see src/utils/dndbeyond/README.md). This exists purely to get around the
 * browser: that endpoint doesn't send CORS headers, so the "Import from D&D
 * Beyond" page (app/newCharacter/import) can't fetch it directly - a Next.js
 * route handler runs server-side, where that restriction doesn't apply.
 *
 * Returns `{ data: <raw D&D Beyond character JSON> }` on success, or
 * `{ error: string }` (with a non-2xx status) on failure - always a message
 * meant to be shown to the player as-is (e.g. "make sure the character's
 * sharing is set to Public"), never a raw exception.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ error: "That doesn't look like a D&D Beyond character id." }, { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${DDB_API_BASE}/${id}`, { cache: "no-store" });
  } catch {
    return NextResponse.json(
      { error: "Couldn't reach D&D Beyond right now - check your connection and try again." },
      { status: 502 },
    );
  }

  if (upstream.status === 404) {
    return NextResponse.json({ error: `No D&D Beyond character found with id ${id}.` }, { status: 404 });
  }

  if (!upstream.ok) {
    return NextResponse.json(
      {
        error: `D&D Beyond returned an unexpected error (HTTP ${upstream.status}). Make sure the character's sharing is set to Public (or "Anyone with the link").`,
      },
      { status: 502 },
    );
  }

  let body: unknown;
  try {
    body = await upstream.json();
  } catch {
    return NextResponse.json(
      { error: "D&D Beyond's response wasn't valid JSON - the unofficial endpoint this uses may have changed." },
      { status: 502 },
    );
  }

  const parsed = body as { success?: boolean; message?: string; data?: unknown };
  if (!parsed?.success || !parsed.data) {
    return NextResponse.json(
      {
        error:
          parsed?.message ||
          "D&D Beyond didn't return character data. Double-check the id and that the character's sharing is set to Public.",
      },
      { status: 404 },
    );
  }

  return NextResponse.json({ data: parsed.data });
}
