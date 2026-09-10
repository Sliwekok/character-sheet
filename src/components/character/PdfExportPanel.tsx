"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { StoredCharacter } from "@/interfaces/StoredCharacter";
import {
  PDF_EXPORT_EDITIONS,
  PdfExportEdition,
  exportCharacterToPdf,
  isPdfEditionSupported,
} from "@/utils/pdfExport/exportCharacterPdf";

/**
 * "Export to Fillable PDF" control: clicking it reveals an edition picker
 * (the first step the export always asks for, since which official sheet
 * to fill depends on it) before actually filling and downloading anything.
 * Defaults to the character's own edition when a template exists for it,
 * falling back to 2014 - the only edition with a template today - otherwise.
 * Adding a 2024 template later needs no change here: the picker is driven
 * entirely by `PDF_EXPORT_EDITIONS` (see `exportCharacterPdf.ts`).
 */
export function PdfExportPanel({ character }: { character: StoredCharacter }) {
  const [open, setOpen] = useState(false);
  const [edition, setEdition] = useState<PdfExportEdition>(
    isPdfEditionSupported(character.edition) ? character.edition : "2014"
  );
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    setIsExporting(true);
    setError(null);
    try {
      await exportCharacterToPdf(character, edition);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't export that PDF.");
    } finally {
      setIsExporting(false);
    }
  }

  if (!open) {
    return (
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Export to Fillable PDF
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-(--radius-lg) border border-border-strong px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="pdf-export-edition" className="text-sm text-fontcolor-secondary">
          Sheet edition
        </label>
        <select
          id="pdf-export-edition"
          value={edition}
          onChange={(event) => setEdition(event.target.value as PdfExportEdition)}
          className="h-9 rounded-(--radius) border border-border-strong bg-background px-2 text-sm text-fontcolor"
        >
          {PDF_EXPORT_EDITIONS.map((option) => (
            <option key={option.edition} value={option.edition} disabled={!option.templateUrl}>
              {option.label}
            </option>
          ))}
        </select>
        <Button size="sm" onClick={handleExport} disabled={isExporting || !isPdfEditionSupported(edition)}>
          {isExporting ? "Filling PDF…" : "Download"}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)} disabled={isExporting}>
          Cancel
        </Button>
      </div>
      {error && <p className="text-sm text-foreground-danger">{error}</p>}
    </div>
  );
}
