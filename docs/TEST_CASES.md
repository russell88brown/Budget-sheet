# Test Cases

This file defines manual regression tests for the scenario-enabled planning engine.

## Preconditions

- Run setup stages: `Structure`, `Validation + settings`, `Theme`.
- Confirm `Settings` includes scenario list in column `H` with at least `Base` and `Stress`.
- If using defaults, run `Load default data`.

## End-to-End Run Checklist

Run this quick sequence after housekeeping or setup changes:

1. Accounts
- Run `Run Budget...` with `Summarise Accounts` only.
- Expected: account summary columns update with no errors.

2. Journal
- Run `Run Budget...` with `Generate journal` only.
- Expected: journal rows generate for the selected scenario.

3. Daily
- Run `Run Budget...` with `Generate daily` only.
- Expected: `Daily` is rebuilt from journal rows for the selected scenario.

4. Monthly
- Run `Run Budget...` with `Generate monthly` only.
- Expected: `Monthly` rolls up from `Daily` without errors.

5. Dashboard
- Run `Run Budget...` with `Generate dashboard` only.
- Expected: dashboard metrics/charts refresh and show the selected scenario.

## Phase 2 (No Dashboard)

### Scope and done criteria

1. Accounts hardening
- Goal: make Accounts summaries deterministic and scenario-safe.
- Scope: `Summarise Accounts` only.
- Done when:
  - Base/Stress summaries do not overwrite each other.
  - Re-running gives identical results.

2. Journal reliability
- Goal: make journal generation the trusted source of truth.
- Scope: event build/sort/write and scenario filtering.
- Done when:
  - Base vs Stress isolation is exact.
  - Row counts/balances are repeatable for fixtures.

3. Daily integrity
- Goal: ensure Daily is a clean projection of Journal.
- Scope: per-day aggregation and scenario filtering.
- Done when:
  - Daily totals reconcile to journal balances.
  - No stale rows after reruns.

4. Monthly integrity
- Goal: ensure Monthly correctly rolls up Daily.
- Scope: min/max/net-change/ending by account.
- Done when:
  - Month start/end math reconciles to Daily.
  - Repeat runs are idempotent.

5. Guardrails + tests
- Goal: lock behavior before adding Dashboard.
- Scope:
  - Expand test cases for Accounts -> Journal -> Daily -> Monthly only.
  - Add one known fixture expected-output check.
  - Known fixture check: run `Deterministic Fixture Tests (Phase 2) -> Fixture A` and verify expected `Accounts` and `Journal` values exactly.
- Done when:
  - Full non-dashboard regression passes in one click path.

### Suggested run sequence each cycle

1. `Fix Structure`
2. `Fix Rules`
3. `Summarise Accounts`
4. `Generate journal`
5. `Generate daily`
6. `Generate monthly`

### Phase 2 execution checks

1. Accounts hardening: duplicate-name guard
- In `Accounts`, create two included rows with the same `Account Name` under the same `Scenario`.
- Run `Run Budget...` with `Summarise Accounts`.
- Expected:
  - Run fails fast with a duplicate-account error for that scenario.
  - No partial cross-scenario overwrite is performed.

2. Accounts hardening: repeatability
- Use valid unique account names per scenario.
- Run `Summarise Accounts` twice for `Base`, then twice for `Stress`.
- Expected:
  - Summary columns are identical across repeat runs for the same scenario.
  - Running `Stress` does not alter `Base` rows and vice versa.

3. Journal prerequisite guard
- Select scenario mode `Choose custom scenario(s)` and pick a scenario set that has no Journal rows yet.
- Run `Generate daily` (or `Generate monthly`) without running `Generate journal` first.
- Expected:
  - Run fails with message indicating no Journal rows found for the selected scenario set.

4. Reconciliation guardrails
- Run sequence for a scenario set: `Generate journal` -> `Generate daily` -> `Generate monthly`.
- Expected:
  - Daily reconciliation against Journal passes (no mismatch error).
  - Monthly reconciliation against Daily passes (no mismatch error).
  - Re-running the same sequence is idempotent.

## Core Scenario Tests

1. Base run parity
- Leave all rows blank for `Scenario` or set all to `Base`.
- Run `Run Budget...` with:
  - scenario mode: `Use Base scenario`
  - operations: `Generate journal`
- Expected:
  - Journal rows are generated.
  - Journal `Scenario` column is `Base` for all rows.
  - No runtime errors.

2. Scenario isolation
- Duplicate one income/expense row and set duplicate `Scenario=Stress`.
- Run `Run Budget...` with:
  - scenario mode: `Use Base scenario`
  - operations: `Generate journal`
- Expected:
  - Stress-only row does not affect Journal amounts.
- Run again with:
  - scenario mode: `Choose custom scenario(s)`
  - scenario selected: `Stress`
  - operations: `Generate journal`
- Expected:
  - Stress row affects results.

3. Summary scenario filter
- After a `Stress` journal run, run `Run Budget...` with:
  - scenario mode: `Choose custom scenario(s)` and select `Stress`
  - operations: `Generate daily`, `Generate monthly`, `Generate dashboard`
- Expected:
  - `Dashboard` metrics include `Scenario = Stress`.
  - Daily/Monthly values are based on Stress journal rows only.

4. Account-summary per-scenario write scope
- Create at least one `Accounts` row with `Scenario=Base` and one with `Scenario=Stress`.
- Run `Run Budget...` with:
  - scenario mode: `Choose custom scenario(s)` and select both `Base` and `Stress`
  - operations: `Summarise Accounts`
- Expected:
  - Account summary columns (`Money In / Month`, `Money Out / Month`, `Net Interest / Month`, `Net Change / Month`) are recalculated for each selected scenario.
  - Running one scenario does not clear summary values on rows belonging to the other scenario.

5. Export grouping by scenario + month
- Ensure Journal has at least two months and two scenarios.
- Run `Export` including `Journal`.
- Expected:
  - Journal export files/rows are partitioned by `Scenario + Month`.
  - JSON payload includes `scenario`.

5a. Export includes summary sheets
- Run `Export` including `Daily`, `Monthly`, and `Dashboard`.
- Expected:
  - Export output includes all selected sheets.
  - Dashboard export contains the `Scenario Delta` block when dashboard was built for a non-Base scenario.

6. Unknown scenario validation
- Put `Scenario=BadScenario` on an included input row.
- Run forecast/journal with preprocessing path (`Run forecast`).
- Expected:
  - Row is auto-disabled (`Include=false`).
  - Run completes without crash.
  - Toast indicates rows were disabled for unknown scenario values.

7. Run metadata tracking
- Run `Run Budget...` with:
  - scenario mode: `Choose custom scenario(s)` and select `Stress`
  - operations: `Generate journal`
- Expected in `Settings`:
  - `B5 = Journal` or `Forecast` (depending on action)
  - `B6 = Stress`
  - `B7` timestamp updated
  - `B8 = Success`
  - New row appended in run log area `J:N` with matching mode/scenario/status.

8. Scenario delta block on dashboard
- Ensure both `Base` and `Stress` Journal data exist.
- Run `Run Budget...` with:
  - scenario mode: `Choose custom scenario(s)` and select `Stress`
  - operations: `Generate daily`, `Generate monthly`, `Generate dashboard`
- Expected:
  - Dashboard includes a `Scenario Delta` block.
  - `Compared To` is `Base`.
  - Delta rows render numeric values for:
    - `Ending Net Delta`
    - `Cash Min Delta`
    - `Days Cash < 0 Delta`
    - `Days Net < 0 Delta`

## Deterministic Fixture Tests (Phase 2)

Script editor runners (automated):
- `runDeterministicFixtureTestsPhase2_All`
- `runDeterministicFixtureTestsPhase2_FixtureA`
- `runDeterministicFixtureTestsPhase2_FixtureB`
- `runDeterministicFixtureTestsPhase2_FixtureC`
- `runDeterministicFixtureTestsPhase2_FixtureD`
- `runDeterministicFixtureTestsPhase2_FixtureE`

1. Fixture A: single-month baseline
- Set named range `ForecastStartDate` to `2030-01-01`.
- Set named range `ForecastEndDate` to `2030-01-31`.
- Clear data rows (keep headers) in `Accounts`, `Income`, `Expense`, `Transfers`, `Policies`, `Goals`, `Risk`.
- Add exactly these `Accounts` rows:
  - `Operating | 1000 | Cash | TRUE | Base`
  - `Card | -500 | Credit | TRUE | Base`
- Add exactly this `Income` row:
  - `TRUE | Base | Salary | Paycheck | 1200 | Monthly | 1 | 2026-01-01 | 2026-12-31 | Operating`
- Add exactly this `Expense` row:
  - `TRUE | Base | Fixed | Rent | 700 | Monthly | 1 | 2026-01-01 | 2026-12-31 | Operating`
- Add exactly this `Transfers` row:
  - `TRUE | Base | Transfer - Amount | Card Payment | 200 | Monthly | 1 | 2026-01-01 | 2026-12-31 | Operating | Card`
- Run `Run Budget...` with:
  - scenario mode: `Use Base scenario`
  - operations: `Summarise Accounts`, `Generate journal`
- Expected `Accounts` values:
  - `Operating`: `Money In / Month = 1200`, `Money Out / Month = 900`, `Net Interest / Month = 0`, `Net Change / Month = 300`
  - `Card`: `Money In / Month = 200`, `Money Out / Month = 0`, `Net Interest / Month = 0`, `Net Change / Month = 200`
- Expected `Journal` values:
  - `COUNTIFS(Scenario,"Base") = 6` (2 opening + income + expense + 2 transfer rows)
  - last `Operating` balance = `1300`
  - last `Card` balance = `-300`

2. Fixture A repeatability
- Without changing any input rows, run the same `Run Budget...` operation again.
- Expected:
  - Account summary values are identical to prior run.
  - Journal row count for `Base` remains `6`.
  - End balances remain `Operating=1300`, `Card=-300`.

## Setup Data Integration Tests

1. Scenario catalog seeding
- On fresh setup, run `Validation + settings`.
- Expected:
  - `Settings!H2:H` contains `Base` and `Stress`.
  - Named range `ScenarioList` points to `H2:H`.

2. Default-data integration
- On empty inputs, run `Load default data`.
- Expected:
  - Inputs load successfully.
  - Scenario catalog still contains `Base` and `Stress`.
  - Rows with missing scenario are interpreted as `Base`.

3. Backward compatibility
- Remove `Scenario` values from existing rows.
- Run `Run Budget...` with:
  - scenario mode: `Use Base scenario`
  - operations: `Generate journal`
- Expected:
  - Behavior matches Base default path.
  - No validation failures due solely to blank scenario.
