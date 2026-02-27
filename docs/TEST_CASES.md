# Manual Regression Checklist

## Preconditions

1. Run setup stages:
   - `Fix Structure`
   - `Fix Rules`
   - `Fix Theme`
2. Confirm tags exist in `Settings!H` (at least `Base`).
3. Optional: run `Load Defaults`.

## Core Run Checks

1. Account summaries
- Run `Run Budget...` with `Summarise Accounts`.
- Expect account monthly summary columns to refresh without errors.

2. Journal
- Run `Run Budget...` with `Generate journal`.
- Expect journal rows for selected tag set.
- Expect invalid included core rows to be auto-disabled before build.

3. Daily
- Run `Generate daily`.
- Expect `Daily` rebuilt from current `Journal` rows for selected tag set.

4. Monthly
- Run `Generate monthly`.
- Expect `Monthly` rebuilt from `Daily` without reconciliation errors.

5. Dashboard
- Run `Generate dashboard`.
- Expect dashboard metrics/charts refresh for selected tag set.

## Determinism Checks

1. Journal stability
- Run journal twice with unchanged inputs.
- Expect same row ordering and balances.

2. Summary stability
- Run daily/monthly twice from unchanged journal.
- Expect same outputs and reconciliation passes.

3. Multi-tag behavior
- Run with Base + at least one additional tag.
- Expect tag-aware daily/monthly grouping with no same-day collisions.

## Fixture Checks

Run in Apps Script editor:
1. `runDeterministicFixtureTests_All`
2. `runDeterministicFixtureTests_RunAllWithReport`

