# AstroMatrix — TODO

## Current Cleanup
- [ ] Remove unused `params` / `isBlueprintContext` from `app/onboarding/swot-audit.tsx`
- [ ] Review whether the scroll indicator should remain visible on the three onboarding pages
- [ ] Remove unused numbersSummary calculation/import from app/(tabs)/blueprint.tsx

## UI / UX
- [ ] Review remaining small UI polish items
- [ ] Review "Areas to Explore" wording
- [ ] Review "Opportunities" wording
- [ ] Revisit the header breathing-space difference on the three onboarding pages (blueprint-result.tsx, loshu-reveal.tsx, swot-audit.tsx) — top spacing currently feels slightly tighter than the bottom spacing

## Blueprint
- [x] Core Identity Revealed link
- [x] Personal Pattern Review link
- [x] Correct Explore Further order
- [x] Correct Step 3 of 3 label

## Personal Pattern Review
- [ ] Preserve Personal Pattern Review state when navigating Step 3 → Step 2 → Step 3, including expanded sections, explored count, Summary, and next-step buttons

## Onboarding
- [ ] Step 4 special-character validation
- [ ] Sample Profile functionality
- [ ] Implement "Explore with Sample" functionality

## Remedies
- [ ] Continue remaining small UI polish items
- [ ] Revisit Celebration animation investigation
- [ ] Daily Activations — Prerequisite Completion Persistence (Deferred — unresolved)
  - Observed issue: Color Cue and Body & Breath Reset completion states can intermittently appear incomplete after force-closing and reopening the app.
  - Testing: The result has varied between runs and completion orders.
  - Existing safeguards: Ritual Store hydration guard and serialized persistence write queue have been implemented. TypeScript passes and 901 tests across 25 suites pass, but the device issue is not consistently resolved.
  - Impact: Users may need to repeat prerequisite practices after restarting the app.
  - Next action: Reinvestigate the persistence/hydration behavior before public release.

## Later
- [ ] Review any additional pending functionality before final release
