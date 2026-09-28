# Testing

The project uses [Vitest](https://vitest.dev) for everything: unit tests, React
component tests (Testing Library + jsdom), and integration tests that run the real
API route handlers against a real MongoDB.

```bash
npm test                  # everything (unit + components + integration)
npm run test:watch        # watch mode
npm run test:unit         # just the pure-logic tests
npm run test:components   # just the React component tests
npm run test:integration  # just the API + MongoDB tests
npm run test:coverage     # full run with a coverage report in ./coverage
npx vitest run src/utils/dice.test.ts   # a single file
```

## Layout

| Project | Files | Environment | What it covers |
|---|---|---|---|
| `unit` | `src/**/*.test.ts` (next to the code) | node | Rules math (dice, HP, Hit Dice, AC, proficiency, spell slots, spell rolls, attacks, weapon mastery, ASIs, point buy), the D&D Beyond converter helpers, import/export, `server/*` helpers, the D&D Beyond proxy route, and the client `storage.ts`/`sync.ts` against a fake server |
| `components` | `src/**/*.test.tsx` (next to the component) | jsdom | HitPointsEditor, ShortRestDialog, SkillsPanel, SpellSlotsPanel, StatusPanel, RollHistoryWidget, FeatureGroup/FeatureEntry, AbilityScoresPanel, Tabs, Button |
| `integration` | `tests/integration/**/*.test.ts` | node (sync test: jsdom) | `/api/auth/*` and `/api/characters/*` end to end, and the browser sync engine talking to those real routes |

A unit test that needs `window`/`localStorage` opts into jsdom with a
`// @vitest-environment jsdom` comment on its first line (see `storage.test.ts`).

Shared helpers:

- `tests/fixtures/characters.ts` - `makeCharacter()` / `makeStoredCharacter()` build a
  level-1 Human Fighter from the real compendium data (2024 by default, pass
  `edition: "2014"` for the old rules); override only the fields a test cares about.
  Also `classLevel()`, `armor("Chain Mail")`, `weapon("Longsword")`.
- `tests/fixtures/spells.ts` - `makeSpell()`, `compendiumSpell("Fireball")`, `makeClass()`
  and friends for the spellcasting tests.

## Integration tests and MongoDB

`tests/integration/globalSetup.ts` starts one MongoDB for the run:

- **By default** it uses [mongodb-memory-server](https://github.com/typegoose/mongodb-memory-server).
  The first run downloads a `mongod` binary (~70 MB, cached under
  `node_modules/.cache`), so it needs internet once; after that it's offline and fast.
- **To use a MongoDB you already run** (e.g. the local server from `.env.local`),
  set `MONGODB_TEST_URI`:

  ```powershell
  # PowerShell
  $env:MONGODB_TEST_URI = "mongodb://127.0.0.1:27017"; npm run test:integration
  ```
  ```bash
  # bash
  MONGODB_TEST_URI=mongodb://127.0.0.1:27017 npm run test:integration
  ```

  Each test file gets its own throwaway database named `cs_test_<random>`, which is
  dropped when the file finishes - the app's real `characterSheet` database is never
  touched.

What's real and what's faked (`tests/integration/setup.ts`):

- Route handlers, `server/auth.ts`, `server/characters.ts`, `server/db.ts`, the rate
  limiter and MongoDB are all real.
- `next/headers` is replaced: `cookies()` and `headers()` read from a fake browser
  (`createBrowser()` in `tests/integration/helpers/api.ts`) that keeps its own cookie
  jar and IP address, so you can sign in on a "laptop" and a "phone" and watch
  sessions interact.
- `bcryptjs` runs at 4 rounds instead of 12, purely for speed.
- The password-reset email is captured with a mocked `sendMail` (see `auth.test.ts`).

Writing a new API test:

```ts
import { call, createBrowser, registerUser } from "./helpers/api";

const browser = createBrowser();
await registerUser(browser);                       // signed in now
const res = await call("/api/characters", { browser });
expect(res.status).toBe(200);
```

`call(path, { method, body, browser, headers })` routes the request to the matching
`app/api/**/route.ts` handler. Add new routes to `resolveRoute()` in the same file.
`createFetch(browser)` gives you a `fetch` that does the same, for running client code
(`utils/api.ts`, `utils/sync.ts`) against the real backend.

## Conventions

- Test behaviour through exported functions / what the user sees - no snapshots.
- Dice are random: pin them with `vi.spyOn(Math, "random").mockReturnValue(...)`
  (`rollDie` is `floor(random * sides) + 1`). Mocks are restored after every test.
- `utils/sync.ts` keeps module-level state; its tests `vi.resetModules()` and
  re-import it (and `storage.ts`) before each test.
- Suspected app bugs found while writing tests are recorded as
  `it.todo("BUG: ...")` rather than as failing or bent tests. List them with
  `npx vitest run 2>&1 | grep -i "BUG:"` - or search the test files for `BUG:`.
