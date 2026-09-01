"use client";

import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Nav from "../../layout/nav";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  Container,
  SectionHeading,
  StatBlock,
  formatModifier,
} from "@/components/ui";
import { StoredCharacter } from "@/interfaces/StoredCharacter";
import { parseImportedCharacter, readFileAsText } from "@/utils/characterImportExport";
import { toCharacterSummary } from "@/utils/characterSummary";
import { saveCharacter } from "@/utils/storage";

/**
 * Third "New character" entry point, alongside the step-by-step wizard and
 * the random generator: load a character previously exported as JSON (see
 * the "Export as JSON" button on app/character/[id]) rather than building
 * one from scratch. The imported character is shown back as a preview -
 * the same summary shape /home's cards use (see utils/characterSummary.ts)
 * - so the player can confirm it's the right file before it's added to
 * their list; nothing is saved until they do.
 */
export default function ImportCharacterPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [imported, setImported] = useState<StoredCharacter | null>(null);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Reset the input so choosing the same file again (e.g. after fixing
    // it and re-exporting under the same name) still fires a change event.
    event.target.value = "";
    if (!file) return;

    setError(null);
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

  function handleConfirm() {
    if (!imported) return;
    const saved = saveCharacter(imported);
    router.push(`/character/${saved.id}`);
  }

  function handleChooseDifferent() {
    setImported(null);
    setError(null);
    fileInputRef.current?.click();
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
      <Nav />
      <Container size="md" className="pb-24">
        <SectionHeading
          eyebrow="New character"
          title="Import"
          subtitle="Load a character you previously exported as a JSON file."
        />

        <div className="mt-8 flex flex-col gap-6">
          {error && (
            <Alert variant="danger" title="Couldn't import that file" onDismiss={() => setError(null)}>
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
            <Card>
              <CardContent className="flex flex-col items-start gap-4">
                <span className="text-3xl">📥</span>
                <p className="text-sm text-fontcolor-secondary">
                  Choose a <code>.json</code> file exported from this app (see the &quot;Export as
                  JSON&quot; button on a character&apos;s page) to bring that character into your list here.
                </p>
                <Button onClick={() => fileInputRef.current?.click()}>Choose file&hellip;</Button>
              </CardContent>
            </Card>
          )}

          {summary && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-fontcolor-secondary">
                Here&apos;s what was found in that file - save it to add it to your characters.
              </p>

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
                  Choose a different file
                </Button>
              </div>
            </div>
          )}
        </div>
      </Container>
    </>
  );
}
