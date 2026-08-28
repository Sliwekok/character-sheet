"use client";

import { Suspense } from "react";
import ManualWizard from "./ManualWizard";

// ManualWizard reads the ?edit=<id> query param via useSearchParams, which
// Next.js requires a Suspense boundary around (see the App Router docs on
// useSearchParams) - kept in this thin wrapper so ManualWizard itself
// doesn't need to know about that requirement.
export default function ManualCharacterPage() {
  return (
    <Suspense fallback={null}>
      <ManualWizard />
    </Suspense>
  );
}
