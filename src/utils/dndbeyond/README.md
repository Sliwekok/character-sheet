# Importing a character from D&D Beyond

D&D Beyond doesn't offer an official "download as JSON" for a character -
just the PDF export on its own character sheet page. It does, however,
have an **unofficial, undocumented** endpoint that its own character sheet
page calls to get the character's data as JSON - the same one community
tools like Beyond20 and ddb-proxy have relied on for years:

```
https://character-service.dndbeyond.com/character/v5/character/<id>
```

**Where this lives in the app:** New character &rarr; Import
(`app/newCharacter/import`) has a "From D&D Beyond" section alongside the
existing file-based import - enter a character id or profile URL, confirm
the character's D&D Beyond sharing is set to **Public** (or "Anyone with
the link" - that endpoint can't see private characters), and it fetches,
converts, and previews the character before you save it, the same as
importing a `.json` file does.

Because the D&D Beyond side is unofficial, the request can't be made
directly from the browser (that endpoint sends no CORS headers), so it
goes through a small server-side proxy route,
`app/api/dndbeyond/[id]/route.ts`, which just forwards the request and
passes back either the character JSON or a plain-language error - it does
nothing else and stores nothing.

The actual conversion logic lives in this folder:

- `types.ts` - partial types for the raw D&D Beyond JSON (only the fields
  actually used - see its header comment for which parts are uncertain).
- `textUtils.ts` - HTML-to-plain-text and name-normalizing helpers.
- `matchCompendium.ts` - finds a D&D Beyond name in this app's own
  compendium arrays (`@/data`).
- `readModifiers.ts` - best-effort reading of D&D Beyond's `modifiers`
  grouping for ability-score bonuses and skill proficiencies (see "Best
  effort" below - this is read defensively and degrades to "found
  nothing" rather than crashing if the shape doesn't match).
- `convert.ts` - `convertDndBeyondCharacter()`, the entry point: takes one
  raw D&D Beyond character payload and a resolution ruleset, returns
  either `{ character, warnings, edition }` or `{ error }`. Never throws.

## What imports reliably

- Name, race, background, class(es)/levels/subclass, alignment.
- Base ability scores, hit points (current/max), currency.
- Equipped weapons, armor, and shield - matched to this app's compendium by
  base item type (e.g. D&D Beyond's "Flame Tongue Greatsword" is matched to
  this app's "Greatsword" and re-enchanted with the magic properties, via
  the same `enchantWeapon`/`enchantArmor` helpers a player would use to
  homebrew a magic item by hand). Equipped rings/wands/potions/other magic
  items, similarly.
- Inspiration, and the flavor text boxes (personality/ideals/bonds/flaws,
  backstory, appearance, allies/organizations, treasure).
- The background's origin feat (2024 rules).

## Best effort - double-check these on the sheet

D&D Beyond's public JSON doesn't cleanly expose everything this app wants,
and a couple of things weren't confirmed against a live character during
development (see `types.ts`'s header comment) - these are read
defensively and simply come up empty (with a warning shown on the preview
screen) if the shape turns out to differ from what's expected:

- **Ability score bonuses beyond the base stats** (a feat's Ability Score
  Improvement, a magic item, etc.) and **skill proficiencies** - read from
  D&D Beyond's `modifiers` data if present; empty if it can't be read.
- **Languages known** and **spells known/prepared** - not populated; add
  them on the sheet (worth doing for every caster you import).
- **Feats taken beyond the background's origin feat** (e.g. a level-up
  Ability Score Improvement choice) - not populated.
- **HP roll history, weapon mastery choices, fighting style choices,
  feature choices** (e.g. a Warlock's Pact Boon) - this app tracks these as
  bookkeeping for its own wizard; an imported character simply starts
  without them, the same as any character saved before these features
  existed (the app already handles that gracefully everywhere it matters).
- Homebrew races/classes/backgrounds/subclasses, or ones from a sourcebook
  this app hasn't built, aren't supported - the import fails outright with
  a clear error naming what wasn't found, shown on the Import page, rather
  than guessing.
