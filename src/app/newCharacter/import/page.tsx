"use client";

import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  Container,
  SectionHeading,
  StatBlock,
  TextInput,
  formatModifier,
} from "@/components/ui";
import { StoredCharacter } from "@/interfaces/StoredCharacter";
import { parseImportedCharacter, readFileAsText } from "@/utils/characterImportExport";
import { toCharacterSummary } from "@/utils/characterSummary";
import { saveCharacter } from "@/utils/storage";
import { parseCharacterId } from "@/utils/dndbeyond/characterId";
import { convertDndBeyondCharacter, isConvertError } from "@/utils/dndbeyond/convert";

/**
 * Third "New character" entry point, alongside the step-by-step wizard and
 * the random generator: either load a character previously exported as
 * JSON (see the "Export as JSON" button on app/character/[id]), or pull one
 * directly from D&D Beyond by character id/URL (see
 * src/utils/dndbeyond/README.md for how that works and what it can/can't
 * import). Both paths land in the same preview - the same summary shape
 * /home's cards use (see utils/characterSummary.ts) - so the player can
 * confirm it's the right character before it's added to their list;
 * nothing is saved until they do.
 */
export default function ImportCharacterPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [imported, setImported] = useState<StoredCharacter | null>(null);

  const [ddbInput, setDdbInput] = useState("");
  const [ddbConfirmedPublic, setDdbConfirmedPublic] = useState(false);
  const [ddbLoading, setDdbLoading] = useState(false);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Reset the input so choosing the same file again (e.g. after fixing
    // it and re-exporting under the same name) still fires a change event.
    event.target.value = "";
    if (!file) return;

    setError(null);
    setWarnings([]);
    setImported(null);

    let text: string;
    try {
      text = await readFileAsText(file);
    } catch {
      setError("Couldn't read that file - please try again.");
      return;
    }

    const result = parseImportedCharacter(text);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setImported(result.character);
  }

  async function handleDdbImport() {
    setError(null);
    setWarnings([]);
    setImported(null);

    const characterId = parseCharacterId(ddbInput);
    if (!characterId) {
      setError("Enter a D&D Beyond character id or profile URL (e.g. https://www.dndbeyond.com/characters/161349291).");
      return;
    }
    if (!ddbConfirmedPublic) {
      setError('Please confirm this character’s D&D Beyond sharing is set to Public before importing.');
      return;
    }

    setDdbLoading(true);
    try {
      const response = await fetch(`/api/dndbeyond/${characterId}`);
      const body = await response.json().catch(() => null);

      if (!response.ok || !body?.data) {
        setError(body?.error || `D&D Beyond returned an unexpected error (HTTP ${response.status}).`);
        return;
      }

      const outcome = await convertDndBeyondCharacter(body.data);
      if (isConvertError(outcome)) {
        setError(outcome.error);
        return;
      }

      setImported(outcome.character);
      setWarnings(outcome.warnings);
    } catch {
      setError("Something went wrong importing that character. Please try again.");
    } finally {
      setDdbLoading(false);
    }
  }

  function handleConfirm() {
    if (!imported) return;
    const saved = saveCharacter(imported);
    router.push(`/character/${saved.id}`);
  }

  function handleChooseDifferent() {
    setImported(null);
    setError(null);
    setWarnings([]);
  }

  const summary = imported ? toCharacterSummary(imported) : null;
  const stats = summary
    ? [
        { label: "STR", value: formatModifier(summary.abilityModifiers.strength) },
        { label: "DEX", value: formatModifier(summary.abilityModifiers.dexterity) },
        { label: "CON", value: formatModifier(summary.abilityModifiers.constitution) },
        { label: "INT", value: formatModifier(summary.abilityModifiers.intelligence) },
        { label: "WIS", value: formatModifier(summary.abilityModifiers.wisdom) },
        { label: "CHA", value: formatModifier(summary.abilityModifiers.charisma) },
      ]
    : [];

  return (
    <>
      <Container size="md" className="pb-24">
        <SectionHeading
          eyebrow="New character"
          title="Import"
          subtitle="Load a character you previously exported as a JSON file, or pull one straight from D&D Beyond."
        />

        <div className="mt-8 flex flex-col gap-6">
          {error && (
            <Alert variant="danger" title="Couldn't import that character" onDismiss={() => setError(null)}>
              {error}
            </Alert>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleFileChange}
            className="hidden"
          />

          {!summary && (
            <div className="flex flex-col gap-6">
              <Card>
                <CardContent className="flex flex-col items-start gap-4">
                  <span className="text-3xl">📥</span>
                  <h3 className="font-display text-xl tracking-wide text-fontcolor">From a file</h3>
                  <p className="text-sm text-fontcolor-secondary">
                    Choose a <code>.json</code> file exported from this app (see the &quot;Export as
                    JSON&quot; button on a character&apos;s page) to bring that character into your list here.
                  </p>
                  <Button onClick={() => fileInputRef.current?.click()}>Choose file&hellip;</Button>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex flex-col items-start gap-4">
                  <span className="text-3xl">🐉</span>
                  <h3 className="font-display text-xl tracking-wide text-fontcolor">From D&D Beyond</h3>
                  <p className="text-sm text-fontcolor-secondary">
                    Enter a D&D Beyond character id or profile link to pull that character in directly. This
                    uses an unofficial D&D Beyond endpoint, so a few details (exact ability-score bonuses,
                    skill proficiencies, spells known) may need a manual check afterward - see the preview
                    before saving.
                  </p>

                  <TextInput
                    value={ddbInput}
                    onChange={(event) => setDdbInput(event.target.value)}
                    placeholder="161349291 or https://www.dndbeyond.com/characters/161349291"
                    disabled={ddbLoading}
                    aria-label="D&D Beyond character id or URL"
                  />

                  <label className="flex items-start gap-2 text-sm text-fontcolor-secondary">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={ddbConfirmedPublic}
                      onChange={(event) => setDdbConfirmedPublic(event.target.checked)}
                      disabled={ddbLoading}
                    />
                    <span>
                      This character&apos;s D&D Beyond sharing is set to <strong>Public</strong> (or &quot;Anyone
                      with the link&quot;) - private characters can&apos;t be read this way.
                    </span>
                  </label>

                  <Button
                    onClick={handleDdbImport}
                    disabled={ddbLoading || !ddbInput.trim() || !ddbConfirmedPublic}
                  >
                    {ddbLoading ? "Importing…" : "Import from D&D Beyond"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {summary && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-fontcolor-secondary">
                Here&apos;s what was found - save it to add it to your characters.
              </p>

              {warnings.length > 0 && (
                <Alert variant="warning" title="Double-check these on the sheet after saving">
                  <ul className="list-disc pl-5">
                    {warnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </Alert>
              )}

              <Card>
                <CardContent className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="font-display text-2xl tracking-wide text-fontcolor">{summary.name}</h3>
                      <p className="text-sm text-fontcolor-secondary">
                        Level {summary.level} &middot; {summary.className}
                      </p>
                    </div>
                    <Badge variant="outline">{summary.alignment}</Badge>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Badge variant="solid">AC {summary.armorClass}</Badge>
                    <Badge variant="muted">Initiative {formatModifier(summary.initiative)}</Badge>
                  </div>

                  <StatBlock stats={stats} />
                </CardContent>
              </Card>

              <div className="flex flex-wrap items-center gap-3">
                <Button onClick={handleConfirm}>Save character</Button>
                <Button variant="secondary" onClick={handleChooseDifferent}>
                  Start over
                </Button>
              </div>
            </div>
          )}
        </div>
      </Container>
    </>
  );
}
