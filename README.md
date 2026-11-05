# Chromatoplectrumology

Practice guitar in the browser. Plug in an audio interface, pick your input and output, shape your tone with effects, and play along with scales while the app listens and scores you. Built to grow into other instruments; guitar is the first.

## Features

- Audio interface input/output selection, live effects (overdrive, amp EQ, chorus, delay, reverb)
- Scale practice with pitch detection, combo and accuracy scoring, fretboard and tuner, metronome
- Every word on the site comes from the database, in many languages, with an admin page to edit it (`/th`, `/en`, `/jp`, `/lo` ...)
- Accounts with an admin role; admin pages for translations, languages, instruments, scales, effects and photos
- Light and dark themes, animated landing page, instrument picker

## Stack

Next.js 16 (App Router, Cache Components), React 19, Tailwind CSS 4, Drizzle ORM with Neon Postgres, Better Auth, Web Audio API.

## Run it

```bash
npm install
# .env.local needs DATABASE_URL and BETTER_AUTH_SECRET
npm run db:push     # create tables
npm run db:seed     # languages, translations, catalog
npm run dev
```

Make yourself an admin after signing up: `npm run make-admin -- you@example.com`.

Photos are from Unsplash (credits in `public/images/instruments/CREDITS.md`). Translations other than English and Thai are machine drafts and should be reviewed by native speakers.
