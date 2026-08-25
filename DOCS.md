# Character Sheet — Project Documentation

*Generated from a read of the codebase on 2026-08-25. This describes what exists in the repo today, not a design spec — sections below call out stubs and open bugs where relevant.*

## Overview

This is a Next.js web app for creating new or randomly-generated Dungeons & Dragons character sheets. The project is early-stage: the data model (TypeScript interfaces for characters, races, classes, armor, spells) is fairly well fleshed out, but only one page (`/home`) renders anything beyond a placeholder, and that page currently shows a single hardcoded example character rather than real, dynamic data. There is no character creation form, no persistence layer, and no random-generation logic yet, despite those being the stated goals in the app's own landing-page copy ("Got idea? → Create it → Upgrade it → Play it").

The GitHub remote referenced in the landing page footer is `github.com/Sliwekok/character-sheet`.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15.3.0 (App Router), dev server runs with `--turbopack` |
| UI library | React 19 / react-dom 19 |
| Language | TypeScript 5, `strict: true` |
| Styling | Tailwind CSS v4 via `@tailwindcss/postcss`, plus a small set of custom CSS variables in `globals.css` |
| Fonts | `next/font/google` — Geist Sans and Geist Mono |
| Linting | ESLint 8, config extends `react-app` (Create React App's ruleset, not the Next.js one) |
| Misc dependencies | `react-use` (only `useWindowSize` is currently used, on the landing page); `react-router` / `react-router-dom` are installed but **unused** — the app navigates entirely with `next/link`, so these two packages look like leftovers that can likely be removed |

Path alias: `@/*` maps to `./src/*` (configured in `tsconfig.json`).

## Project structure

```
src/
  app/
    layout.tsx            root layout (fonts, metadata, <html>/<body>)
    page.tsx               "/" — landing page
    globals.css             Tailwind import + theme CSS variables
    about/page.tsx          "/about" — stub
    home/page.tsx           "/home" — main character list page (placeholder data)
    newCharacter/page.tsx   "/newCharacter" — stub
    layout/nav.tsx           shared <Nav> component used by home/page.tsx
  interfaces/
    Characters.ts           Character, AbilityScores
    CharacterClass.ts       CharacterClass, getSpellSlots()
    Race.ts                  Race
    Armor.ts                 Armor, ArmorCategory
    Currency.ts               Currency
    Spell.ts                  Spell
    SpellSlots.ts              SpellSlots, SpellcastingProgression
    SpellSlotsProgression.ts   full/half/third caster spell-slot tables
    Classes/
      Fighter.ts               concrete Fighter CharacterClass
      Wizard.ts                concrete Wizard CharacterClass
    Race/
      Human.ts                  concrete Human Race
  utils/
    abilityModifiers.ts         calculateAbilityModifiers()
    calculateArmorClass.ts      calculateArmorClass()
    calculateMaxHp.ts            calculateMaxHP()
public/
  01.png                        dice-icon logo, used in nav and landing page
  sketch/1.png … 8.png           hand-drawn UI concept sketches
  sketch/resized/1.png … 8.png    resized versions, shown as decorative background on "/"
```

Every route currently has an accompanying `styles.css` file (`about/styles.css`, `home/styles.css`, `newCharacter/styles.css`) but all three are empty — styling so far is done entirely through Tailwind utility classes in the JSX.

## Routes

| Route | File | Status |
|---|---|---|
| `/` | `src/app/page.tsx` | Landing page. Shows the app logo, a 4-step pitch list, a "Start now" link to `/home`, an external link to dndbeyond.com, and a footer linking to `/about` and the GitHub repo. Background is a randomly-shuffled 4×2 grid of the sketch images from `public/sketch/resized`, re-shuffled once on mount via `useEffect`. |
| `/home` | `src/app/home/page.tsx` | Renders the shared `<Nav>` plus a "Characters" panel. Currently shows exactly one hardcoded character card (name, level, alignment, class, AC, initiative, and all six ability-score modifiers) — none of it reads from the `Character` interface or any state; it's static JSX. |
| `/about` | `src/app/about/page.tsx` | Stub — renders the literal text `about`. |
| `/newCharacter` | `src/app/newCharacter/page.tsx` | Stub — renders the literal text `new character`. This is the page that will presumably host the "create new / random character" flow the app is named for. Note the component function is named `newCharacterPage` (lowercase first letter), which deviates from the PascalCase convention used by every other page component. |

`layout.tsx` still has the default `create-next-app` metadata (`title: "Create Next App"`, matching description) — this hasn't been customized for the project yet.

### Nav component (`src/app/layout/nav.tsx`)

A responsive nav bar with three links (Home, new Character, About) and the app logo. On mobile it collapses to a hamburger icon (inline SVG, toggled via `useState`) that expands into a full-screen link list; on desktop it shows a horizontal bar including a "Search for wisdom" text input. The search input has no `onChange` handler or associated state, so it's currently non-functional. The two inline SVG icons use `fill-rule`/`clip-rule` attributes (SVG/HTML casing) rather than the `fillRule`/`clipRule` React/JSX expects for these presentational attributes — worth fixing if it produces console warnings.

## Data model

### `Character` (`interfaces/Characters.ts`)

The central type. Notably, `getModifiers` is typed as a **function** (`() => AbilityModifiers`), not a plain object.

| Field | Type |
|---|---|
| `name` | `string` |
| `level` | `number` |
| `race` | `Race` |
| `background` | `string` |
| `alignment` | `string` |
| `class` | `CharacterClass` |
| `abilityScores` | `AbilityScores` (str/dex/con/int/wis/cha, all `number`) |
| `equippedArmor?` | `Armor` |
| `shield?` | `Armor` |
| `currency` | `Currency` |
| `initiative` | `number` |
| `currentHP` / `maxHP` | `number` |
| `getModifiers` | `() => AbilityModifiers` |
| `edition` | `string` |
| `languages` | `string[]` |

### `CharacterClass` (`interfaces/CharacterClass.ts`)

`name`, `hitDie`, `proficiencies: string[]`, `primaryAbility` (a key of `AbilityScores`), `casterProgression: 'full' | 'half' | 'third' | 'none'`, and an optional `spellcasting` block holding the class's `SpellcastingProgression`, its casting ability, and optional functions for spell save DC / spell attack bonus. The file also defines a helper `getSpellSlots(charClass, level)` that isn't exported and isn't referenced anywhere else yet.

Two concrete classes exist under `interfaces/Classes/`: `Fighter` (d10, non-caster, STR-primary) and `Wizard` (d6, full caster keyed to INT, using `fullCasterProgression`).

### `Race` (`interfaces/Race.ts`)

`name`, `traits: string[]`, `abilityModifiers: Partial<AbilityScores>`, `speed`, `languages: string[]`. One concrete race exists, `Human` (`interfaces/Race/Human.ts`): +1 to every ability score, speed 30, Common language.

### `Armor` (`interfaces/Armor.ts`)

`name`, `category` (`'light' | 'medium' | 'heavy' | 'shield'`), `baseAC`, optional `dexterityModifier: { enabled, max? }`, `stealthDisadvantage?`, `strengthRequirement?`, `material?`, and `bonus?` for magic items. No concrete armor items exist yet.

### `Currency`, `Spell`, `SpellSlots`

`Currency` holds `copper` / `silver` / `electrum` / `gold` / `platinume` — note the last field is misspelled (`platinume` instead of `platinum`). `Spell` covers name, level (0 = cantrip), school, description, casting time, range, components, and duration; no concrete spells are defined yet. `SpellSlots` is a level→count map, and `SpellcastingProgression` is a character-level→`SpellSlots` map.

`interfaces/Race/SpellSlotsProgression.ts` (despite living under `Race/`, this is class spellcasting data, not race data) exports three tables: `fullCasterProgression`, `halfCasterProgression`, and `thirdCasterProgression`, each covering levels 1–20. **`halfCasterProgression` and `thirdCasterProgression` are currently identical** — in standard 5e rules third-casters gain slots more slowly than half-casters, so this table likely still needs its own values filled in.

## Utility functions (`src/utils`)

`calculateAbilityModifiers(scores)` implements the standard 5e formula, `floor((score - 10) / 2)`, for each of the six abilities and returns an `AbilityModifiers` map.

`calculateArmorClass(character)` starts from AC 10, and if armor is equipped uses the armor's `baseAC` plus (if allowed) the Dex modifier, capped at `dexterityModifier.max` when set, plus any magic `bonus`; if unarmored it uses `10 + full Dex score` rather than the Dex modifier. A shield's `baseAC` and `bonus` are added on top. One likely bug: the function reads `character.getModifiers.dexterity` — since `getModifiers` on `Character` is a function, not an object, this needs to be called as `character.getModifiers().dexterity` to actually return a modifier value.

`calculateMaxHP(character)` computes first-level HP as `hitDie + conMod`, and each additional level as `floor(hitDie / 2) + 1 + conMod`. Here `conMod` is taken directly from `abilityScores.constitution` — that's the raw ability score, not a modifier (`calculateAbilityModifiers` is never called). For a typical starting Constitution above 10 this will overstate HP; the fix is presumably to run the ability score through `calculateAbilityModifiers` first. Also worth noting: the file is `calculateMaxHp.ts` (lowercase "hp") but exports `calculateMaxHP` (uppercase) — inconsistent but not currently a functional problem.

## Styling / theme

`globals.css` imports Tailwind and defines a small dark, gold-accented D&D-style palette as CSS variables, mapped into Tailwind's theme via `@theme inline`:

| Variable | Value | Used for |
|---|---|---|
| `--background` | `#102E50` | page background |
| `--background-darken` | `#0A1D2B` | nav bar, card backgrounds |
| `--fontcolor` | `#F5C45E` | default text color (gold) |
| `--fontcolor-secondary` | `#9b9b9b` | secondary/label text |
| `--foreground` | `#E78B48` | accent (buttons, borders) |
| `--fontsize` | `18px` | base font size |

## Assets

`public/01.png` is the app's dice-icon logo, used in the nav bar and on the landing page. `public/sketch/` contains eight hand-drawn concept sketches (presumably early UI mockups for the app), with `public/sketch/resized/` holding resized copies used as a decorative background grid on the landing page. The default Next.js starter SVGs (`file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`) are also still present and partly reused (e.g. `vercel.svg` on the "Start now" button, `file.svg`/`window.svg` in the footer).

## Development

```bash
npm run dev     # start dev server (Turbopack) at http://localhost:3000
npm run build   # production build
npm run start   # run the production build
npm run lint    # ESLint (react-app config)
```

## Suggested next steps

Based on what's implemented versus what's stubbed out, the natural next pieces of work are: building out `/newCharacter` (the character creation / random-generation flow the app is named for, currently an empty stub); wiring `/home` up to real character state instead of the one hardcoded card; adding more concrete `Race`, `CharacterClass`, `Armor`, and `Spell` data beyond the single Human/Fighter/Wizard examples that exist today; and fixing the `getModifiers()` call-site bug and the raw-score-as-modifier bug called out above, since both feed directly into AC and HP display once real character data is wired in.
