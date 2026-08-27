# Architecture

## Stack

| Layer      | Choice                                                              |
|------------|----------------------------------------------------------------------|
| Framework  | [Next.js](https://nextjs.org) 15 (App Router), React 19             |
| Language   | TypeScript, `strict: true`                                          |
| Styling    | Tailwind CSS v4 (`@tailwindcss/postcss`), CSS custom properties for theming |
| Fonts      | `next/font/google` — Geist Sans, Geist Mono, Cinzel (display font)  |
| Dev server | `next dev --turbopack`                                              |
| Lint       | `next lint` with `eslint-config-react-app`                          |
| Routing lib| `react-router` / `react-router-dom` are listed as dependencies but the app itself is 100% App Router (`src/app`) — no evidence of react-router being used anywhere under `src/`. Likely a leftover from scaffolding or an earlier prototype. |

There is no test runner, state-management library, form library, or backend
configured. `package.json` has no `test` script.

## Path alias

`tsconfig.json` maps `@/*` → `./src/*`, used throughout (`@/components/ui`,
`@/interfaces/Characters`, `@/utils/cn`, etc.).

## Folder layout

```
src/
  app/                  Next.js App Router pages
    layout.tsx           Root layout: loads fonts, sets <html>/<body>, imports globals.css
    page.tsx              "/" — marketing/landing page
    home/page.tsx          "/home" — character list (mock data)
    newCharacter/page.tsx   "/newCharacter" — creation flow placeholder
    about/page.tsx          "/about" — static about page
    layout/nav.tsx          Shared <Nav> bar, imported by each page directly
    globals.css             Tailwind import + CSS custom properties (theme)
  components/
    ui/                   Generic, app-agnostic UI primitives
    character/             Domain components built on top of ui/ (currently just CharacterCard)
  interfaces/             TypeScript types for the whole D&D domain model
  data/                   Static game content (races, classes, spells, weapons, ...)
  utils/                  Pure functions that derive stats from a Character
public/                  Static assets (dice icon, sketch illustrations, SVG placeholders)
```

## Routing

The project uses the **App Router**, but pages are not colocated under nested route
segments the way `nav.tsx` might suggest — `app/layout/nav.tsx` is a plain component
(not a route) that every page imports and renders manually:

```tsx
// app/home/page.tsx
import Nav from "../layout/nav";

export default function HomePage() {
  return (
    <>
      <Nav />
      {/* ... */}
    </>
  );
}
```

This is a deliberate (if slightly unusual) choice: there is no shared route-group
layout wrapping `/home`, `/about`, and `/newCharacter` — instead each page's
`page.tsx` starts with `<Nav />`. The `about/`, `home/`, and `newCharacter/`
directories also each contain an empty `styles.css` (0 bytes, not imported anywhere) —
dead scaffolding left over from `create-next-app`/an earlier styling approach.

Root layout (`app/layout.tsx`) only sets up fonts and the HTML shell; it renders
`{children}` directly with no nav, so `/` (the landing page) intentionally has no nav
bar while every other page adds its own.

## Styling system

Tailwind v4's CSS-first configuration is used — there's no `tailwind.config.ts`.
Theming lives entirely in `src/app/globals.css`:

- A `:root` block defines raw CSS custom properties for the color palette
  (`--background`, `--background-darken`, `--background-elevated`, `--fontcolor`,
  `--fontcolor-secondary`, `--foreground`, `--foreground-hover`), border tokens, and
  three border-radius steps (`--radius-sm` / `--radius` / `--radius-lg`).
- An `@theme inline` block re-exposes those as Tailwind color/font tokens
  (`--color-background`, `--font-display`, etc.), which is what makes classes like
  `bg-background-darken`, `text-fontcolor-secondary`, and `font-display` resolve.
  `--font-display` maps to Cinzel, the small-caps-styled fantasy display font used for
  all headings/logo text; body copy uses Geist Sans.
- `body` gets a fixed radial-gradient background (dark blue → near-black) and the base
  font settings; there's no light/dark mode — it's a single dark fantasy theme.

Component-level styling is plain Tailwind utility classes composed via `cn()`
(`src/utils/cn.ts`) — a minimal, dependency-free classnames joiner (no `clsx` or
`tailwind-merge`); it just filters falsy values and joins the rest, so conflicting
utility classes are **not** deduplicated/merged, only literal falsy values
(`false`/`null`/`undefined`) are dropped.

## Images

Landing page (`app/page.tsx`) randomly shuffles 8 pre-rendered sketch illustrations
from `public/sketch/resized/` as decorative background tiles, using `react-use`'s
`useWindowSize` to size tiles responsively. The shuffle runs once in a `useEffect` (not
during render) specifically to avoid a hydration mismatch between server and client
`Math.random()` output.
