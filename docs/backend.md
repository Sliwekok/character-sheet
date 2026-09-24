# Backend: accounts & character sync

Accounts are **optional**. Every page works exactly the same signed out -
characters live in the browser's `localStorage`, like before there was a
backend. Signing in only adds a cloud copy of your characters so they follow
you to other devices.

## Pieces

| Where | What |
|-------|------|
| `src/server/db.ts` | MongoDB client (one per process), typed collections, index setup |
| `src/server/auth.ts` | Password hashing (bcrypt), session cookies, current-user lookup |
| `src/server/characters.ts` | Character upsert/delete/list with last-write-wins |
| `src/server/mailer.ts` | SMTP email (nodemailer); prints to the console when SMTP isn't configured |
| `src/server/rateLimit.ts` | In-memory rate limiter for login/register/forgot-password |
| `src/server/http.ts` | JSON helpers, error handling, same-origin check |
| `src/app/api/auth/*` | `register`, `login`, `logout`, `me`, `forgot-password`, `reset-password`, `change-password` |
| `src/app/api/characters` | `GET` list; `[id]`: `GET`, `PUT` (upsert), `DELETE` (tombstone) |
| `src/utils/storage.ts` | localStorage (still the source of truth for the UI) + sync outbox |
| `src/utils/sync.ts` | Background sync engine (browser) |
| `src/components/auth/AuthProvider.tsx` | `useAuth()` / `useSyncStatus()` context, mounted in the root layout |
| `src/components/auth/useStoredCharacter.ts` | Local-first character lookup hooks used by pages |
| `src/app/{login,register,forgot-password,reset-password,account}` | Account pages |

## Collections

- `users` - `email` (unique, lowercased), `displayName`, `passwordHash`, timestamps.
- `sessions` - `tokenHash` (sha256 of the cookie value), `userId`, `expiresAt` (TTL, 30 days).
- `passwordResets` - `tokenHash`, `userId`, `expiresAt` (TTL, 60 minutes), `usedAt`.
- `characters` - `userId` + `characterId` (unique pair), `data` (the whole
  `StoredCharacter` as a JSON string), `name`, `updatedAt`, `deletedAt`.

Indexes are created automatically on first request.

## Auth

- **Sessions** are random 32-byte tokens in an `httpOnly`, `SameSite=Lax`
  cookie (`cs_session`, `Secure` in production). Only the token's sha256 is
  stored, so a database leak can't be replayed as cookies. Logging out
  deletes the session; a password reset or change deletes **all** of the
  user's sessions (other devices get signed out).
- **Passwords**: bcrypt, 12 rounds, 8-128 characters. Login runs a bcrypt
  compare even for unknown emails so response timing doesn't reveal which
  emails have accounts.
- **Forgot password**: `POST /api/auth/forgot-password` always answers
  `{ ok: true }` (no account enumeration). If the account exists, it emails a
  single-use link `/reset-password?token=...` valid for 60 minutes; asking
  again invalidates the previous link. Resetting signs the browser in.
- **Rate limits** (per server process): login 10 / 15 min per email+IP and
  50 / 15 min per IP; register 10 / hour per IP; forgot-password 3 / 15 min
  per email and 10 / hour per IP.
- **CSRF**: `SameSite=Lax` cookie, plus mutating routes reject a request
  whose `Origin` header doesn't match the host.

## Local-first sync

1. Pages read characters from `localStorage` synchronously, as before.
   `saveCharacter`/`deleteCharacter` keep their old signatures.
2. While the local characters are linked to an account, every save/delete
   also writes an entry to an outbox (`character-sheet:sync-queue:v1`).
   `sync.ts` uploads it about a second later (debounced).
3. A full sync (upload outbox -> download all -> upload leftovers) runs when
   you sign in, when the app opens with a session, when the browser comes
   back online, and when the tab regains focus (at most once a minute).
4. If a page asks for a character that isn't in this browser (e.g. a link
   from another device) and you're signed in, it's fetched from the server
   with a skeleton in the meantime. `/home` shows skeleton cards only when
   the browser has no characters yet and the first download is still
   running.
5. **Conflicts**: last write wins by `updatedAt`. Deletes are kept as
   tombstones so another device can't bring a deleted character back with
   an older copy.

What happens to characters already in the browser at sign-in:

- made while signed out -> added to the account you sign in to (or register);
- already linked to the same account -> kept, pending changes uploaded;
- linked to a different account -> replaced by the new account's characters.

Signing out first tries to upload pending changes (and warns if it can't),
then removes the account's characters from the browser, so the next person
using it doesn't see them.

## Setup

1. Install MongoDB Community Server locally (or create a free MongoDB Atlas cluster).
2. `cp .env.example .env.local` and set `MONGODB_URI` (and SMTP settings if you want real emails).
3. `npm install`, then `npm run dev`.

Without SMTP settings, password-reset emails are printed to the `npm run dev`
terminal, so you can click the link from there.

## Limits / next steps

- The rate limiter is in memory: it resets on restart and isn't shared
  between server instances. Move it to MongoDB/Redis if you deploy to
  more than one instance (e.g. serverless).
- No email verification on sign-up yet. The reset-token machinery can be
  reused for it.
- Compendium data (spells, classes, items) is still static, lazy-loaded
  files on purpose: it's read-only reference data, so a database would only
  add latency. Homebrew/custom content would be the reason to add a
  collection for it.
