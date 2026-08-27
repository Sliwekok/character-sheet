# Character Sheet — Documentation

This is the documentation set for the `character-sheet` project: a Next.js app for
building and managing Dungeons & Dragons 5th Edition characters, supporting both the
2014 (original 5e) and 2024 (revised "5.5e") Players Handbook rules side by side.

These docs describe the codebase **as it currently stands** — what's implemented,
what's stubbed out, and what to know before extending it. They're generated from a
read-through of the source, not from a design spec, so treat them as a map of the
territory rather than a promise of where the project is headed.

## Where to start

- **[architecture.md](./architecture.md)** — tech stack, folder layout, routing, and
  the visual/styling system. Start here if you're new to the repo.
- **[data-model.md](./data-model.md)** — the `Character` shape and every interface
  around it (`Race`, `CharacterClass`, `Background`, `Feat`, `Spell`, `Weapon`,
  `Armor`, `MagicItem`), plus how 2014 vs. 2024 content is organized and merged.
- **[components.md](./components.md)** — the UI kit (`components/ui`) and the
  character-facing components built on top of it (`components/character`).
- **[calculations.md](./calculations.md)** — the game-math utilities (ability
  modifiers, armor class, max HP, spellcasting slots, weapon mastery, custom magic
  items) and the caveats/known-fixed-bugs called out in their source comments.

## One-paragraph summary

The app is a standard Next.js App Router project (`src/app`) styled with Tailwind CSS
v4 and a small hand-rolled UI kit (`src/components/ui`). The domain model lives in
`src/interfaces` and is edition-aware: almost every content type (`Race`,
`CharacterClass`, `Background`, `Feat`, `Subclass`) carries an `edition: "2014" | "2024"`
field, while rules that didn't change between editions (`Weapon`, `Armor`, `Spell`,
`MagicItem`) are edition-agnostic and shared. `src/data/index.ts` assembles both
rulesets into a single `getRuleset(edition)` lookup. `src/utils` holds the derived-stat
math (AC, HP, spell slots, weapon mastery). As of this writing, the **only** working
end-to-end feature is browsing a static list of characters (`/home`, currently backed
by mock data) — the actual character-creation flow (`/newCharacter`) is a placeholder
screen with no form behind it yet, and there is no persistence layer (no database, no
local storage, no API routes).

## Running it locally

```bash
npm install
npm run dev      # next dev --turbopack, http://localhost:3000
npm run build    # production build
npm run start    # serve the production build
npm run lint     # next lint (eslint-config-react-app)
```

No environment variables or external services are required — everything the app
currently does runs client-side against data bundled at build time.
