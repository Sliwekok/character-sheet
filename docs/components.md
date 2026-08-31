# Components

Two layers: a generic UI kit (`src/components/ui`) with no D&D knowledge, and
domain components (`src/components/character`) built on top of it.

## UI kit (`src/components/ui`)

Everything is re-exported from `components/ui/index.ts`, so consumers import from
`@/components/ui` rather than individual files.

### `Button`

`Button.tsx` — a single component that renders either a Next.js `<Link>` (when an
`href` prop is passed) or a plain `<button>`, sharing the same `variant`
(`"primary" | "secondary" | "ghost"`) and `size` (`"sm" | "md" | "lg"`) styling either
way. The prop typing uses a discriminated union (`ButtonAsButton | ButtonAsLink`) keyed
on the presence of `href` so callers get the right HTML attributes typed for whichever
mode they're using.

### `Card` family

`Card.tsx` exports `Card`, `CardHeader`, `CardTitle`, `CardContent`, `CardFooter` —
composable pieces (all thin styled `<div>`/`<h3>` wrappers) rather than a single
monolithic component. Used by `CharacterCard`, the about page, and the new-character
placeholder.

### `Badge`

Small pill for tags (class, alignment, AC, initiative). Three variants: `solid`,
`outline` (default), `muted`.

### `Container`

Centered, responsively-padded wrapper reused by every page, with a `size` prop
(`"md" | "lg" | "xl"`, default `"xl"`) controlling max-width.

### `SectionHeading`

The eyebrow-label + display-font title + gold accent rule + subtitle pattern used at
the top of every page (`Home`, `About`, `New Character`). Supports `align: "left" |
"center"`.

### `TextInput`

Styled `<input>` with an optional leading icon slot. Used for the nav search field
(`Nav`'s "Search for wisdom" input, still not wired to anything) and, since the
generator, for free-text wizard fields (character name, manual ability scores,
class level, guided-random basics).

### `Select`

Styled `<select>`, sized/colored to match `TextInput`. Added for the character
generator — every dropdown in the wizard (race, class, subclass, background,
ability-score assignment, alignment) and the random-generator's guided form uses it.

### `Logo`

The dice icon (`public/01.png`) plus an optional Cinzel-font "Character Sheet"
wordmark (`withWordmark`, default `true`). Used in the nav bar.

### `StatBlock` / `formatModifier`

```ts
export function formatModifier(value: number): string; // 2 -> "+2", -1 -> "-1"

export type Stat = { label: string; value: number | string };
export function StatBlock({ stats }: { stats: Stat[] }): JSX.Element;
```

A compact responsive grid of label/value pairs — used for the six ability modifiers on
`CharacterCard`, and generically reusable for any other stat row (AC, initiative, etc.).

### `cn` (`src/utils/cn.ts`, not in `components/ui` but used throughout it)

Not a component, but worth flagging alongside the kit: a intentionally minimal
classnames joiner (filters falsy values, joins the rest) — **not** a `clsx`/
`tailwind-merge` replacement, so it does not deduplicate or resolve conflicting
Tailwind utility classes, only drops literal falsy values.

## Domain components (`src/components/character`)

### `CharacterCard`

Deliberately takes a plain `CharacterSummary` type rather than the full `Character`
interface:

```ts
export type CharacterSummary = {
  id: string;
  name: string;
  level: number;
  alignment: string;
  className: string;
  armorClass: number;
  initiative: number;
  abilityModifiers: {
    strength: number; dexterity: number; constitution: number;
    intelligence: number; wisdom: number; charisma: number;
  };
};
```

The comment in the source explains why: this let the component be driven by
mock/placeholder data early on and swapped to real, generator-produced data later
without the card itself changing — which is exactly what happened. It renders
name/level/class, an alignment badge, AC and initiative badges, and a `StatBlock` of
the six formatted ability modifiers. `utils/characterSummary.ts`'s `toCharacterSummary()`
is what derives this shape from a real `StoredCharacter` (combining
`calculateAbilityModifiers`, `calculateArmorClass`, `getCharacterLevel`, and the
character's own `initiative` — see [calculations.md](./calculations.md)).

There's still no dedicated "view a character" page, so the card's link doubles as the
edit entry point: real characters link to `/newCharacter/manual?edit={id}` (loading
that character back into the wizard, see [generator.md](./generator.md)), while the
`/home` placeholder mock cards (ids prefixed `mock-`) keep the old harmless
`/home#{id}` anchor instead, since they don't exist in storage to edit.

### Wizard components (`src/components/character/wizard`)

`EditionStep`, `RaceStep`, `ClassStep`, `AbilityScoresStep`, `BackgroundStep`,
`SkillsEquipmentStep`, `DetailsStep`, `ReviewStep`, and `StepProgress` — one component
per step of the manual character wizard, each a controlled component (the step's slice
of state plus an `onChange`-style callback, no internal draft state of its own). See
[generator.md](./generator.md) for how `app/newCharacter/manual/ManualWizard.tsx`
orchestrates them, and how `ReviewStep` is reused as-is by the random-generation flow.

`ItemDetailPanel` (also under `wizard/`) is the one exception to "no internal state" -
it's a pure display component for whatever skill/weapon/armor/shield
`SkillsEquipmentStep` last had clicked, and that selection is transient UI state, not
part of the draft, so `SkillsEquipmentStep` owns it locally rather than routing it
through `ManualWizard`. See [generator.md](./generator.md)'s "Skills & equipment"
section.

## Page-level composition

Every page follows the same shape: import `Nav` from `../layout/nav`, wrap content in
`Container`, start with a `SectionHeading`, and put the body in one or more `Card`s.
`Nav` itself (`app/layout/nav.tsx`) is a client component (`"use client"`) — it tracks
active route via `usePathname()` for the desktop link underline, and holds its own
`isOpen` state for the mobile slide-out menu (two inline SVGs swapped for the
hamburger/close icon rather than an icon library).
