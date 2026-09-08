import Link from "next/link";
import { Fragment } from "react";
import { Edition } from "@/interfaces/Edition";

/**
 * URL for a spell's own detail page - the same `/search` route the global
 * search bar and other "view details" links already use (see
 * app/search/page.tsx's `useSpecificItem`/`getSpecificItem`), just
 * pre-filled with this specific spell instead of left for the player to
 * type in themselves.
 */
export function spellSearchHref(edition: Edition, spellName: string): string {
  return `/search?edition=${edition}&type=spells&name=${encodeURIComponent(spellName)}`;
}

/**
 * Renders `text` with every case-insensitive, whole-word mention of a name
 * in `spellNames` turned into a link to that spell's own page (see
 * `spellSearchHref` above) - so a class/subclass feature description that
 * reads "...you learn the *misty step* spell..." lets the player click
 * straight through to what Misty Step actually does, instead of having to
 * separately look it up. A native `title` attribute gives a plain hover
 * hint; this deliberately does NOT reuse the portaled `Tooltip` component
 * (components/ui/Tooltip.tsx) - that's an "i"-icon-button pattern, a poor
 * fit for decorating a run of inline text like this.
 *
 * Kept intentionally simple: matches are found with a single alternation
 * regex built from `spellNames` (longest names first, so e.g. a shorter
 * name can't shadow-match inside a longer one that happens to share a
 * prefix), and only an EXACT (case-insensitive) whole-word match of a
 * spell's full name is decorated - no partial-word/fuzzy matching, and no
 * attempt to catch a pluralized or otherwise reworded mention the
 * description didn't literally spell out.
 */
export function TextWithSpellMentions({
  text,
  spellNames,
  edition,
}: {
  text: string;
  spellNames: string[];
  edition: Edition;
}) {
  if (spellNames.length === 0) return <>{text}</>;

  const pattern = new RegExp(
    `\\b(${[...spellNames]
      .sort((a, b) => b.length - a.length)
      .map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("|")})\\b`,
    "gi"
  );

  const parts = text.split(pattern);
  return (
    <>
      {parts.map((part, index) => {
        const match = spellNames.find((name) => name.toLowerCase() === part.toLowerCase());
        if (!match) return <Fragment key={index}>{part}</Fragment>;
        return (
          <Link
            key={index}
            href={spellSearchHref(edition, match)}
            title={`View ${match}`}
            className="underline decoration-dotted decoration-from-font underline-offset-2 hover:text-accent"
            target="_blank"
          >
            {part}
          </Link>
        );
      })}
    </>
  );
}
