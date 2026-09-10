"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

/**
 * The old HTML print-preview page (and its "Print / Save as PDF" /
 * `window.print()` button) has been removed in favor of the "Export to
 * Fillable PDF" feature on the character page (see
 * components/character/PdfExportPanel.tsx, utils/pdfExport). This route is
 * kept only as a redirect so any old link/bookmark to it still lands
 * somewhere useful, instead of 404ing or showing the removed page.
 *
 * This file, print.module.css, and printHelpers.ts in this folder are no
 * longer used by anything - printHelpers.ts's contents moved to
 * utils/characterSheetHelpers.ts. They can be deleted entirely; they're left
 * on disk only because this session has no file-delete capability on your
 * computer.
 */
export default function PrintCharacterSheetRedirect() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  useEffect(() => {
    router.replace(`/character/${params.id}`);
  }, [router, params.id]);

  return null;
}
