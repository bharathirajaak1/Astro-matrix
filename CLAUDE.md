@AGENTS.md

# AstroMatrix — Project Blueprint

A React Native + Expo (TypeScript) mobile app that turns a person's name and
date of birth into numerology readings, a Lo Shu grid, and a daily forecast.
Remedies for weak/missing numbers are a **locked** feature.

> **Before writing code:** read the exact versioned docs at
> https://docs.expo.dev/versions/v57.0.0/ — Expo APIs in SDK 57 differ from
> older tutorials and from your training data. Verify every `expo-*` import
> signature against those docs.

---

## 1. Tech Stack

| Concern            | Choice                                             |
| ------------------ | -------------------------------------------------- |
| Framework          | Expo SDK **57** (managed workflow)                 |
| Runtime            | React Native **0.86**, React **19.2.3**            |
| Language           | TypeScript (strict mode)                           |
| Navigation         | `expo-router` (file-based, typed routes)           |
| State              | Zustand (lightweight) + React Query for async/cache|
| Local persistence  | `@react-native-async-storage/async-storage`       |
| Secure storage     | `expo-secure-store` (entitlement flags, IAP token) |
| Notifications      | `expo-notifications` (daily forecast reminder)     |
| Styling            | `StyleSheet` + a small theme module (no NativeWind)|
| Forms/validation   | `react-hook-form` + `zod`                          |
| Testing            | Jest + `@testing-library/react-native`             |
| Lint/format        | ESLint (`eslint-config-expo`) + Prettier           |
| Node               | **22.13.x** minimum                                |

Target platforms: iOS 16.4+, Android 7+ (compile/target SDK 36).

---

## 2. Directory Layout

```
app/                      # expo-router routes
  _layout.tsx             # root stack, providers, theme, splash
  index.tsx               # onboarding / profile entry (redirects if profile exists)
  (tabs)/
    _layout.tsx           # bottom tabs
    numerology.tsx        # core numbers + interpretations
    grid.tsx              # Lo Shu grid visual
    forecast.tsx          # today's forecast + history
    remedies.tsx          # LOCKED feature (paywall or unlock CTA)
  profile/
    edit.tsx              # name + DOB editor
  remedy/[number].tsx     # detail for a single remedy (gated)
src/
  core/                   # pure, framework-free calculation engine
    numerology.ts         # life-path, destiny, soul-urge, personality, birthday
    loShu.ts              # digit tallying, missing/repeated numbers, planes
    forecast.ts           # personal day/month/year + daily message selection
    letterValues.ts       # Pythagorean (and optional Chaldean) letter maps
    types.ts
  data/
    interpretations.ts    # number -> meaning copy
    remedies.ts           # number -> remedy copy (content only; gating is elsewhere)
    forecastMessages.ts   # personal-day -> message pool
  features/
    entitlements/         # isRemedyUnlocked(), unlock flow, restore purchases
    profile/              # profile store + AsyncStorage repo
    notifications/        # schedule/cancel daily reminder
  ui/
    components/           # Button, Card, GridCell, NumberBadge, LockOverlay...
    theme.ts              # colors, spacing, typography
  lib/
    date.ts               # DOB parsing/normalization, timezone-safe
    storage.ts            # typed AsyncStorage wrapper
assets/
__tests__/                # mirrors src/core with fixture-based tests
```

**Rule:** everything in `src/core/` is pure TypeScript — no React, no Expo, no
I/O. It takes primitives in and returns plain objects. This keeps the astrology
math unit-testable and portable.

---

## 3. Domain Model

```ts
// src/core/types.ts
export type Digit = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export interface Profile {
  id: string;
  fullName: string;        // as used at birth, for name-based numbers
  dob: string;             // ISO 'YYYY-MM-DD'
  system: 'pythagorean' | 'chaldean';
  createdAt: string;
}

export interface NumerologyReport {
  lifePath: Digit | 11 | 22 | 33;
  destiny: Digit | 11 | 22 | 33;   // aka Expression
  soulUrge: Digit | 11 | 22 | 33;  // vowels
  personality: Digit | 11 | 22 | 33; // consonants
  birthday: number;                 // day of month, unreduced
  reductions: Record<string, number[]>; // step trail for transparency
}

export interface LoShuGrid {
  counts: Record<Digit, number>;  // how many times each digit appears in DOB
  missing: Digit[];
  repeated: Digit[];
  planes: {                       // mental/emotional/practical + 3 verticals + 2 diagonals
    mind: boolean; soul: boolean; practical: boolean;
    thought: boolean; will: boolean; action: boolean;
    goldenYogas: string[];        // fully-present lines
    silverYogas: string[];        // fully-absent lines
  };
}

export interface Forecast {
  date: string;                   // ISO
  personalYear: Digit;
  personalMonth: Digit;
  personalDay: Digit;
  headline: string;
  body: string;
  luckyNumber: Digit;
  focus: 'rest' | 'action' | 'connect' | 'plan' | 'create';
}
```

---

## 4. Calculation Rules (single source of truth)

### 4.1 Reduction
- Reduce by summing digits repeatedly until a single digit **1–9**.
- **Master numbers 11, 22, 33** are preserved (not reduced) for Life Path,
  Destiny, Soul Urge, Personality. They ARE reduced for forecast math.
- Always keep the intermediate steps in `reductions` so the UI can "show the work".

### 4.2 Numerology
- **Life Path** = reduce(day) + reduce(month) + reduce(year), then reduce the sum.
- **Destiny/Expression** = sum of all letters of `fullName` via `letterValues`.
- **Soul Urge** = sum of vowels only (treat `Y` as vowel when not adjacent to another vowel — document the exact rule in `letterValues.ts`).
- **Personality** = sum of consonants only.
- **Birthday** = day of month, unreduced (1–31).
- Pythagorean map A=1…I=9, J=1…R=9, S=1…Z=8. Chaldean map behind the `system` flag.

### 4.3 Lo Shu Grid
- Take every digit of the **full DOB** (`DDMMYYYY`), ignoring zeros.
- Optionally append Life Path / Destiny digits ("Loshu with drivers") — behind a
  setting, default **off**. Keep the base grid pure.
- Grid positions are fixed:
  ```
  4 9 2
  3 5 7
  8 1 6
  ```
- `missing` = digits with count 0. `repeated` = count ≥ 2.
- Planes/arrows: a line is a "golden yoga" if all three cells are non-zero,
  "silver yoga" if all three are zero.

### 4.4 Forecast
- **Personal Year** = reduce(birthDay) + reduce(birthMonth) + reduce(currentYear).
- **Personal Month** = reduce(personalYear + currentMonth).
- **Personal Day** = reduce(personalMonth + currentDay).
- `headline`/`body` are selected deterministically from `forecastMessages.ts`
  keyed by `personalDay` (+ a stable per-date index so the same day always
  yields the same message). No randomness that changes on re-open.

---

## 5. Locked Remedy Feature

The Remedies tab and `remedy/[number].tsx` are **gated**. Design so the gate is
one function and one component — never scattered `if` checks.

- `features/entitlements/useEntitlement()` → `{ remediesUnlocked: boolean, unlock(): Promise<void>, restore(): Promise<void>, loading }`.
- Persist the unlock flag in `expo-secure-store` (key: `entitlement.remedies`).
  Treat it as a cache; the source of truth is the store/IAP receipt.
- Unlock mechanism (pick one, keep the interface stable):
  - **v1:** `expo-in-app-purchases` is deprecated — use **RevenueCat**
    (`react-native-purchases`) OR a promo-code / one-time unlock screen.
  - The `unlock()`/`restore()` interface must not change when the mechanism does.
- UI:
  - `remedies.tsx` always renders the list of remedy categories with a
    `<LockOverlay>` blur + CTA when `!remediesUnlocked`.
  - Remedy **content** (`data/remedies.ts`) is bundled but must not be reachable
    via navigation while locked — guard in `remedy/[number].tsx` with a redirect.
  - Free teaser: show which numbers are missing/weak from the Lo Shu grid, but
    blur the actual remedy text.
- Analytics events: `remedy_paywall_view`, `remedy_unlock_start`,
  `remedy_unlock_success`, `remedy_restore`.

---

## 6. Persistence & Privacy

- Only one `Profile` in v1 (`profile.current` in AsyncStorage). Multi-profile is a
  later milestone — keep the repo API list-shaped now (`getAll`, `getById`).
- DOB and name never leave the device. No analytics PII. If a backend is added,
  it must be opt-in and documented here first.
- `lib/storage.ts` is the only module that touches AsyncStorage directly; it
  exposes typed `get<T>(key)` / `set<T>(key, value)` and namespaces all keys
  under `astromatrix/`.

---

## 7. Notifications

- One scheduled local notification per day (default 08:00 local) with the
  forecast headline.
- Ask permission lazily — only after the user enables the reminder toggle in
  settings, never on first launch.
- Reschedule on app open if the profile changed or the schedule drifted.
- All notification code lives in `src/features/notifications/`.

---

## 8. UX / Screens

1. **Onboarding** (`app/index.tsx`) — name + DOB + system picker → writes profile → redirects to tabs.
2. **Numerology tab** — cards for Life Path, Destiny, Soul Urge, Personality, Birthday; each expandable to show the reduction trail and interpretation.
3. **Lo Shu tab** — 3×3 grid, filled cells emphasized, badges for repeated counts, chips for missing numbers, list of arrows/yogas.
4. **Forecast tab** — today's card up top, 7-day strip below, tap a past/future day for its reading.
5. **Remedies tab** — locked; teaser + paywall.
6. **Profile edit** — change name/DOB, re-runs all calculations.

Accessibility: every grid cell and number badge needs an `accessibilityLabel`
("Number 5 appears twice"). Support dynamic type. Dark mode via `theme.ts`.

---

## 9. Testing Strategy

- **Core engine:** exhaustive fixture tests in `__tests__/core/`. Include known
  reference cases (e.g. a DOB whose Life Path is a master number, a name with
  trailing `Y`, a DOB with many zeros). Every rule in §4 needs a test.
- **Determinism:** forecast for a fixed profile + fixed date must be stable
  across runs.
- **Components:** render tests for `LockOverlay` (locked vs unlocked), `GridCell`,
  and the paywall CTA.
- **No network in unit tests.** Mock `expo-secure-store` and IAP.
- Run: `npm test`. Lint: `npm run lint`. Types: `npx tsc --noEmit`.

---

## 10. Commands

```bash
npx create-expo-app@latest astro-matrix -t expo-template-blank-typescript
npx expo install expo-router expo-secure-store expo-notifications \
  @react-native-async-storage/async-storage
npx expo start                 # dev
npx expo run:ios / run:android # native builds when needed
eas build --profile preview    # distributable builds
```

---

## 11. Coding Conventions

- TypeScript `strict: true`; no `any` in `src/core/`.
- Pure functions in `core/` return new objects; never mutate inputs.
- Path alias `@/` → `src/` (configure in `tsconfig.json` + `babel.config.js`).
- One component per file; colocate styles at the bottom via `StyleSheet.create`.
- Copy/interpretation text lives in `src/data/`, never inline in components, so it
  can be reviewed and localized later.
- Feature gating goes through `useEntitlement()` only.
- Check `expo-*` API signatures against the SDK 57 docs before use — do not rely
  on memory or older examples.

---

## 12. Milestones

1. **M1 – Engine:** `core/` numerology + Lo Shu + forecast, fully tested. No UI.
2. **M2 – Read-only app:** onboarding, three tabs render real data from a profile.
3. **M3 – Persistence + notifications:** AsyncStorage profile, daily reminder.
4. **M4 – Locked remedies:** paywall UI, `useEntitlement()`, secure-store flag, teaser.
5. **M5 – Polish:** dark mode, a11y pass, EAS preview build, store assets.
