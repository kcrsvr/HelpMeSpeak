# HelpMeSpeak — Phase 1 (Local-only MVP)

A communication aid for non-verbal autistic children. This is **Phase 1**: a
fully working React Native (Expo) app that runs **entirely on-device** — no
cloud, no auth, no sync. A single family on one iPhone/iPad gets real value.

Built for iPhone (tested target: iPhone 16 / iOS), also runs on Android and iPad.

## What's included

**Child Mode**
- Home with a Featured row + category tiles
- Category grid (2/3/4 per row, caregiver-configurable)
- Full **Word Experience**: picture enlarges → audio plays → letters spell out
  one by one → confetti celebration → "Again?" replay
- 4 themes (Calm Blue, Rohit, Nature Green, High Contrast), applied per child

**Caregiver Mode** (PIN-protected, dark admin UI)
- 4-digit PIN gate (PIN stored **hashed** on device, never in plain text)
- Dashboard with profile card + quick actions
- **Add/Edit Word wizard** (5 steps): pick photo → record audio (with playback /
  re-record) → type word → assign category → review + set featured
- Manage categories (add / delete, with cascade warning)
- Manage child profiles (up to 3, switch active, add/delete)
- Per-child settings: theme (live preview), spelling speed, grid size,
  TTS fallback toggle, animation/haptics toggle

**Storage (all local)**
- SQLite (`expo-sqlite`) for profiles, categories, words, settings
- Device filesystem (`expo-file-system`) for photos and audio recordings
- On-device TTS (`expo-speech`) as the audio fallback when no recording exists

## Requirements

> **Node.js is required and was not installed on the build machine.**
> Install it first, then run the commands below.

- **Node.js 20 LTS** — https://nodejs.org (or `brew install node@20`). Use an
  LTS release; the very latest Node majors (25/26) can trip the Expo SDK 51 CLI.
- **Xcode** (for the iOS Simulator) — from the Mac App Store
- The **Expo Go** app on a physical device (optional, easiest way to test)

## Setup & run

```bash
cd app-phase1

# 1. install dependencies
npm install

# 2. start the dev server
npx expo start
```

Then:
- Press **i** to open the **iOS Simulator**, or
- Scan the QR code with **Expo Go** on a physical iPhone.

```bash
# type-check (no build needed)
npm run typecheck
```

### First launch flow
Splash → 3-step onboarding → set a 4-digit caregiver PIN → the child's home
screen appears, pre-loaded with categories and words. Tap any word to see the
full experience. Tap **🔒 Caregiver** in the bottom nav and enter your PIN to
manage content.

> Note on native modules: audio recording, photo picking, and haptics use
> native code. They work in the iOS Simulator for the most part, but
> **microphone recording is best tested on a physical device**. If you build a
> standalone binary later, run `npx expo prebuild` / EAS Build — Expo Go already
> bundles these modules for development.

## Project structure

```
app-phase1/
├── App.tsx                 Navigation + providers + theme sync
├── index.ts                Expo entry
├── app.json                Expo config (iOS permissions, plugins)
└── src/
    ├── theme/              4 themes + ThemeContext
    ├── data/               SQLite (db, schema), types, seed content,
    │                       repositories (CRUD), media (file storage)
    ├── state/              AppContext (settings, profiles, active profile)
    ├── components/         Button, PinPad, WordTile, Confetti
    ├── navigation/         route param types
    ├── screens/            all child + caregiver screens
    └── utils/              pin hashing, id generation, audio playback
```

## Data model (kept close to the Phase 2 cloud schema)

`profiles`, `categories`, `words`, and a key/value `settings` table. Foreign
keys cascade on delete (hard delete, per the design doc). The shapes mirror the
AppSync `@model` types in `../design.md`, so the Phase 2 cloud migration is a
wiring exercise, not a rewrite.

## Not in Phase 1 (by design)

No accounts, no cloud sync, no multi-device, no backup. Those are Phase 2+
(AppSync + Amplify DataStore) — see `../design.md`. The caregiver PIN uses a
salted SHA-256 hash via `expo-crypto`; a native bcrypt module can replace it in
a later hardening pass without touching callers.
```
