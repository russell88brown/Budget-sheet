# Test Cases

This file defines manual regression tests for the scenario-enabled planning engine.

## Preconditions

- Run setup stages: `Structure`, `Validation + settings`, `Theme`.
- Confirm `Settings` includes scenario list in column `H` with at least `Base` and `Stress`.
- If using defaults, run `Load default data`.

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

## Deterministic Fixture Tests (Phase 2)

1. Fixture A: single-month baseline
- Set named range `ForecastStartDate` to `2026-01-01`.
- Set named range `ForecastEndDate` to `2026-01-31`.
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
  - `COUNTIFS(Scenario,"Base") = 5` (2 opening + 3 transactions)
  - last `Operating` balance = `1300`
  - last `Card` balance = `-300`

2. Fixture A repeatability
- Without changing any input rows, run the same `Run Budget...` operation again.
- Expected:
  - Account summary values are identical to prior run.
  - Journal row count for `Base` remains `5`.
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
