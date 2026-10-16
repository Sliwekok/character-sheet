"use client";

import { useState } from "react";
import { Badge } from "@/components/ui";
import { Feat, FeatSelection } from "@/interfaces/Feat";
import { FEAT_CATEGORY_LABELS, summarizeFeatMechanics } from "@/utils/feats";

/**
 * One feat on the character sheet: category, where it came from, what it
 * does to this character (the player's picks - "+1 Dexterity", "Skill
 * proficiency: Stealth", "Spells: Misty Step, Charm Person" - via
 * utils/feats.ts's `summarizeFeatMechanics`), prerequisite, and the full
 * rules text behind a toggle.
 */
export function FeatEntry({ feat, selection, sourceLabel }: { feat: Feat; selection?: FeatSelection; sourceLabel?: string }) {
  const [expanded, setExpanded] = useState(false);
  const effects = summarizeFeatMechanics(feat, selection);

  return (
    <div className="rounded-(--radius-sm) bg-background-darken/60 px-3 py-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold text-fontcolor">{feat.name}</span>
        <Badge variant="outline">{FEAT_CATEGORY_LABELS[feat.category]}</Badge>
        {sourceLabel && <Badge variant="muted">{sourceLabel}</Badge>}
        {feat.prerequisite && <Badge variant="muted">Requires {feat.prerequisite}</Badge>}
      </div>
      {effects.length > 0 ? (
        <ul className="mt-1 list-disc pl-5 text-xs text-fontcolor">
          {effects.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      ) : (
        feat.abilityScoreIncrease && (
          <p className="mt-1 text-xs text-fontcolor-secondary">
            Ability score increase: +{feat.abilityScoreIncrease.choose} to {feat.abilityScoreIncrease.from.join(", ")}
          </p>
        )
      )}
      <button
        type="button"
        className="mt-1 cursor-pointer text-xs text-fontcolor-secondary underline hover:text-fontcolor"
        onClick={() => setExpanded((open) => !open)}
        aria-expanded={expanded}
      >
        {expanded ? "Hide rules text" : "Show rules text"}
      </button>
      {expanded && <p className="mt-1 whitespace-pre-line text-xs">{feat.description}</p>}
    </div>
  );
}
