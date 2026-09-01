# AstroMatrix Privacy Policy

_Last updated: 2026-09-01_

AstroMatrix is a numerology app. This policy describes what the app does with
your information - which, in short, is: **keep it on your device.**

## What AstroMatrix stores

| Data | Where it lives | Why |
| --- | --- | --- |
| Your name and date of birth | On-device storage (`AsyncStorage`) | To calculate your numerology report, Lo Shu grid, and daily forecast |
| Whether daily reminders are on, and the OS notification permission | On-device storage | To schedule your 8:00 am local reminder |
| Whether remedies are unlocked | On-device secure storage (`SecureStore`, the platform keychain / keystore) | To remember your purchase between app launches |
| Your appearance preference (system/light/dark) | On-device storage | To remember how you like the app to look |

None of the above is uploaded anywhere. AstroMatrix has no backend server and
no account system - there is nothing to log in to, and nothing to sync.

## What AstroMatrix does not do

- It does not collect, transmit, or sell your name, birth date, or any
  reading it generates.
- It does not use third-party analytics, advertising, or tracking SDKs.
- It does not access your contacts, location, camera, or microphone.
- It does not share data with any other app or company.

An internal `track()` call exists in the codebase for product events (for
example, viewing the unlock screen); today it only writes to the developer
console during development and sends nothing anywhere. If a real analytics
provider is ever added, this policy will be updated first, and the change
will describe exactly what is collected.

## Notifications

If you turn on the daily reminder, AstroMatrix schedules a **local**
notification on your device at 8:00 am - no push service or server is
involved, and the OS permission can be revoked at any time from your device
settings.

## Purchases

The "unlock remedies" purchase is recorded only on your device. If a payment
processor or app-store billing is integrated in the future, this policy will
be updated to describe what that processor sees (typically limited to
transaction details handled entirely by Apple/Google, not by AstroMatrix).

## Children's privacy

AstroMatrix does not knowingly collect information from children, and since
no information ever leaves the device, none is collected by us in any case.

## Changes to this policy

If AstroMatrix starts sending any data off the device, this file will be
updated first and the in-app version noted below will change.

## Contact

Questions about this policy: **bharathiraja.ak1@gmail.com**
