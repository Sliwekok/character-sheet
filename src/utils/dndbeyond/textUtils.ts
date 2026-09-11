/** Small text helpers shared by convert.ts - nothing D&D Beyond specific. */

/**
 * D&D Beyond's description/flavor-text fields are HTML (`<p>...</p>`,
 * `<strong>`, stray `\r\n`, `&nbsp;`, etc.) - this app's own text fields
 * (Weapon.magicDescription, CharacterDetails.backstory, ...) are plain text
 * boxes, so everything read out of D&D Beyond's rules text goes through
 * this first. Deliberately simple (a handful of regex passes, not a real
 * HTML parser) - good enough for the tag/entity vocabulary D&D Beyond
 * actually uses in these fields, not a general-purpose sanitizer.
 */
export function htmlToPlainText(html: string | null | undefined): string {
  if (!html) return "";
  return html
    .replace(/<\/(p|li|div|h[1-6])>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<li>/gi, "- ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&mdash;/gi, "—")
    .replace(/&ndash;/gi, "–")
    .replace(/&rsquo;/gi, "’")
    .replace(/&lsquo;/gi, "‘")
    .replace(/&rdquo;/gi, "”")
    .replace(/&ldquo;/gi, "“")
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Lowercases, strips punctuation/extra whitespace - the shared basis every name comparison in matchCompendium.ts builds on. */
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
