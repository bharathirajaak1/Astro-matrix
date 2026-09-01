# Building with EAS

`eas.json` and the `app.json` identifiers (`ios.bundleIdentifier`,
`android.package`) are already in place. EAS builds need an Expo account and
an interactive login, so the steps below are for you to run - they can't be
run from an unattended session.

## One-time setup

```bash
npm install --global eas-cli   # or just use `npx eas-cli` each time below
eas login                      # interactive - creates/uses your Expo account
eas init                       # links this repo to an EAS project, writes
                                # expo.extra.eas.projectId into app.json
```

`eas init` will ask to create a project named `astro-matrix` (from
`app.json`'s `slug`) - accept it, or pick another name/owner if this should
live under an organization account.

## Building a preview build (internal distribution, no store submission)

```bash
eas build --profile preview --platform android   # produces an installable .apk
eas build --profile preview --platform ios       # simulator build by default
```

The `preview` profile in `eas.json` builds an Android `.apk` (installable by
sharing a link, no Play Store needed) and an iOS simulator build. For a
preview build installable on a physical iPhone, register the device first
(`eas device:create`) and switch `ios.simulator` to `false` for that build,
or add an `ios: { "simulator": false }` variant profile.

## Building for the stores

```bash
eas build --profile production --platform android
eas build --profile production --platform ios
eas submit --profile production --platform android   # after the build finishes
eas submit --profile production --platform ios
```

`eas submit` needs store credentials configured once (a Google Play service
account JSON, and an App Store Connect API key or Apple ID) - `eas submit`
will prompt for these interactively the first time and remember them.

## Before your first store submission

- [ ] Change `ios.bundleIdentifier` / `android.package` in `app.json` if
      `com.bharathiraja.astromatrix` isn't the identifier you want to publish
      under - it **cannot be changed later** without becoming a new listing.
- [ ] Publish `PRIVACY.md` at a stable URL and add it to both store consoles.
- [ ] Fill in the store listing using [`STORE_LISTING.md`](./STORE_LISTING.md)
      as a draft, and capture screenshots from a real build (see that file).
- [ ] Bump `expo.version` (and `ios.buildNumber` / `android.versionCode`, or
      let `autoIncrement` in the `production` build profile handle the
      latter two) for each new submission.
- [ ] Double-check `app.json`'s `expo-notifications` plugin `color` and the
      app icon/splash assets under `assets/` look right on a real device.

## Local sanity checks before any build

```bash
npm test                 # 347+ unit tests
npx tsc --noEmit          # app types
npx tsc --noEmit -p tsconfig.test.json   # test types
npx expo export --platform ios   # confirms the Metro bundle compiles cleanly
```
