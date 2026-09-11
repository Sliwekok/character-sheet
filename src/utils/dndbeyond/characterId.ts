/** Pulls a numeric D&D Beyond character id out of a bare id ("161349291") or a full profile URL ("https://www.dndbeyond.com/characters/161349291/..."). `undefined` if neither matches. */
export function parseCharacterId(input: string): string | undefined {
  const trimmed = input.trim();
  if (/^\d+$/.test(trimmed)) return trimmed;

  const match = trimmed.match(/characters\/(\d+)/);
  return match?.[1];
}
