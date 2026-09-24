# Character Sheet

A web app for building and running D&D 5e characters, supporting both the 2014 and 2024 rules. Built with Next.js.

## Features

- **Character creation** — a step-by-step manual wizard, a random character generator, or import an existing character straight from D&D Beyond.
- **Digital character sheet** — abilities, skills with one-click d20 rolls, spells, inventory, features & traits, and background all in one tabbed view.
- **Live status tracking** — inspiration, death saves, conditions, exhaustion, and concentration.
- **Compendium search** — browse and search spells, feats, races, classes, subclasses, backgrounds, and magic items.
- **Roll history** — a floating widget that collects rolls made from weapons, spells, and skills.
- **Export** — generate a filled-in PDF character sheet or use the print-friendly view.
- **Roll20 integration** — pair with the [character-sheet-extension-roll20](https://github.com/Sliwekok/character-sheet-extension-roll20) Chrome extension to forward every roll into Roll20 chat automatically.
- **Accounts & cloud sync (optional)** — sign in to back up your characters and open them on any device. Characters are still saved in the browser first, so everything works without an account or offline.

## Getting Started

Install dependencies and set up the environment:

```bash
npm install
cp .env.example .env.local   # then set MONGODB_URI (and SMTP_* for real emails)
```

Accounts and character sync need MongoDB (a local MongoDB Community Server or a free MongoDB Atlas cluster). Without it the app still runs; only signing in won't work. See [docs/backend.md](docs/backend.md).

Run the development server:

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.
