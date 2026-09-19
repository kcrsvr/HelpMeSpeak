# HelpMeSpeak — Test Plan

_Last updated: 2026-09-17_

## 1. Purpose & Scope

This document inventories the HelpMeSpeak app by layer, maps each unit to its
test cases, and tracks coverage status. It covers the automated unit/component
test suite (Jest + `jest-expo` + `@testing-library/react-native`). Manual /
device testing (Expo Go on device, TTS voice quality, real camera/mic) is out
of scope here and tracked separately in `notes.md`.

## 2. Test Environment

| Item | Value |
|------|-------|
| Runner | Jest 30 (`jest-expo` preset) |
| Component testing | `@testing-library/react-native` 14 |
| Setup file | `jest.setup.js` (global Expo/native mocks) |
| SQLite fake | `src/data/__tests__/fakeDb.ts` (`better-sqlite3`) |
| Commands | `npm test`, `npm run test:coverage`, `npm run test:watch` |
| Coverage source | `src/**/*.{ts,tsx}` (excludes `*.d.ts`, `navigation/types.ts`, `data/types.ts`) |

### Global mocks (from `jest.setup.js`)
- `expo-crypto` — deterministic `digestStringAsync` returns `hashed(<input>)`.
- `expo-file-system/legacy` — in-memory stubs (getInfo/makeDir/copy/delete).
- `expo-speech` — `speak` invokes `onDone` immediately; `getAvailableVoicesAsync` returns Samantha.
- `expo-audio` — `createAudioPlayer` fires `didJustFinish` on next tick.
- `expo-haptics`, `expo-image-picker` — permission-granted stubs.
- `@react-navigation/native` — `useFocusEffect` runs the effect immediately.

## 3. Coverage Status by Layer

Legend: ✅ covered · 🟡 partial · ❌ none

| Layer | Unit | Status | Test file |
|-------|------|--------|-----------|
| data | `db.ts` | ✅ | `data/__tests__/repositories.test.ts`, `seed.test.ts` |
| data | `repositories.ts` | ✅ | `data/__tests__/repositories.test.ts` |
| data | `media.ts` | ✅ | `data/__tests__/media.test.ts` |
| data | `seed.ts` | ✅ | `data/__tests__/seed.test.ts` |
| state | `AppContext.tsx` | ✅ | `state/__tests__/AppContext.test.tsx` |
| theme | `ThemeContext.tsx` / `themes.ts` | ✅ | `theme/__tests__/ThemeContext.test.tsx` |
| utils | `id.ts` | ✅ | `utils/__tests__/id.test.ts` |
| utils | `pin.ts` | ✅ | `utils/__tests__/pin.test.ts` |
| utils | `audio.ts` | 🟡 | `utils/__tests__/audio.test.ts` |
| components | `Button.tsx` | ❌ → ✅ | `components/__tests__/Button.test.tsx` (new) |
| components | `PinPad.tsx` | ❌ → ✅ | `components/__tests__/PinPad.test.tsx` (new) |
| components | `WordTile.tsx` | ❌ → ✅ | `components/__tests__/WordTile.test.tsx` (new) |
| components | `Confetti.tsx` | ❌ → ✅ | `components/__tests__/Confetti.test.tsx` (new) |
| screens | `PinGateScreen.tsx` | ❌ → ✅ | `screens/__tests__/PinGateScreen.test.tsx` (new) |
| screens | `WelcomeScreen.tsx` | ❌ → ✅ | `screens/__tests__/WelcomeScreen.test.tsx` (new) |
| screens | other 13 screens | ❌ | _backlog — see §6_ |

## 4. Test Cases — Components (new)

### 4.1 Button (`components/Button.tsx`)
| ID | Case | Expected |
|----|------|----------|
| BTN-1 | Renders the title text | Title is visible |
| BTN-2 | Fires `onPress` when tapped | Handler called once |
| BTN-3 | Disabled button does not fire `onPress` | Handler not called |
| BTN-4 | Exposes `button` role + accessible label | Queryable by role/label = title |

### 4.2 PinPad (`components/PinPad.tsx`)
| ID | Case | Expected |
|----|------|----------|
| PAD-1 | Renders digit keys 0–9 + delete | 11 pressable keys present |
| PAD-2 | Tapping a digit calls `onDigit` with that digit | `onDigit("5")` |
| PAD-3 | Tapping delete calls `onDelete` | `onDelete` called |
| PAD-4 | Renders `maxLength` dots, `length` filled | dot count = maxLength |

### 4.3 WordTile (`components/WordTile.tsx`)
| ID | Case | Expected |
|----|------|----------|
| TILE-1 | Shows emoji when no `photoUri` | Emoji text visible |
| TILE-2 | Shows image when `photoUri` set | Image rendered, emoji absent |
| TILE-3 | Tapping the tile fires `onPress` | Handler called |
| TILE-4 | Label uses `word.word` | Accessible by word |

### 4.4 Confetti (`components/Confetti.tsx`)
| ID | Case | Expected |
|----|------|----------|
| CONF-1 | Renders without crashing (default intensity) | Tree mounts |
| CONF-2 | Higher intensity renders more pieces | piece count scales with intensity |

## 5. Test Cases — Screens (new)

### 5.1 PinGateScreen (`screens/PinGateScreen.tsx`)
| ID | Case | Expected |
|----|------|----------|
| PIN-1 | Correct 4-digit PIN navigates to CaregiverHome | `navigation.replace("CaregiverHome")` |
| PIN-2 | Wrong PIN shows error and clears entry | Error text "Wrong PIN. Try again." shown, no navigation |
| PIN-3 | Cancel returns to previous screen | `navigation.goBack()` called |

### 5.2 WelcomeScreen (`screens/WelcomeScreen.tsx`)
| ID | Case | Expected |
|----|------|----------|
| WEL-1 | Greets the active profile by name | Name text rendered |
| WEL-2 | Speaks the greeting on mount when TTS enabled | `speakPhrase("Welcome, <name>", true)` |
| WEL-3 | Tapping advances to ChildHome | `navigation.replace("ChildHome")` |
| WEL-4 | Auto-advances after timeout | `navigation.replace("ChildHome")` after 3000ms |
| WEL-5 | Falls back to "Friend" when no profile | Renders "Friend" |

## 6. Backlog — Screens Not Yet Automated

High logic density, prioritized for a follow-up pass:
1. `WordExperienceScreen.tsx` (spelling animation, per-letter TTS, confetti)
2. `WordWizardScreen.tsx` (add/edit word: photo, audio, emoji)
3. `ManageProfilesScreen.tsx` (CRUD profiles, avatar upload)
4. `CategoryDetailScreen.tsx`, `ChildHomeScreen.tsx`, `FavoritesScreen.tsx`,
   `RecentlyUsedScreen.tsx`, `CategoryScreen.tsx`, `ManageCategoriesScreen.tsx`,
   `OnboardingScreen.tsx`, `ProfileSettingsScreen.tsx`, `CaregiverHomeScreen.tsx`,
   `SplashScreen.tsx`

Also partial: `utils/audio.ts` recording paths and error branches.

## 7. Exit Criteria
- All automated suites green (`npm test`).
- No new open-handle/teardown leaks introduced.
- Components layer at 100% of the four core components.
- PinGate + Welcome screens cover happy path + primary error/edge paths.
