# Test Cases

This file defines manual regression tests for the scenario-enabled planning engine.

## Preconditions

- Run setup stages: `Structure`, `Validation + settings`, `Theme`.
- Confirm `Settings` includes scenario list in column `H` with at least `Base` and `Stress`.
- If using defaults, run `Load default data`.

## Core Scenario Tests

1. Base run parity
- Leave all rows blank for `Scenario` or set all to `Base`.
- Run `Run journal (Base)`.
- Expected:
  - Journal rows are generated.
  - Journal `Scenario` column is `Base` for all rows.
  - No runtime errors.

2. Scenario isolation
- Duplicate one income/expense row and set duplicate `Scenario=Stress`.
- Run `Run journal for scenario...` and choose `Base`.
- Expected:
  - Stress-only row does not affect Journal amounts.
- Run again for `Stress`.
- Expected:
  - Stress row affects results.

3. Summary scenario filter
- After a `Stress` journal run, run `Run summaries for scenario...` with `Stress`.
- Expected:
  - `Dashboard` metrics include `Scenario = Stress`.
  - Daily/Monthly values are based on Stress journal rows only.

4. Export grouping by scenario + month
- Ensure Journal has at least two months and two scenarios.
- Run `Export` including `Journal`.
- Expected:
  - Journal export files/rows are partitioned by `Scenario + Month`.
  - JSON payload includes `scenario`.

5. Unknown scenario validation
- Put `Scenario=BadScenario` on an included input row.
- Run forecast/journal with preprocessing path (`Run forecast`).
- Expected:
  - Row is auto-disabled (`Include=false`).
  - Run completes without crash.
  - Toast indicates rows were disabled for unknown scenario values.

6. Run metadata tracking
- Run `Run journal for scenario...` with `Stress`.
- Expected in `Settings`:
  - `B5 = Journal` or `Forecast` (depending on action)
  - `B6 = Stress`
  - `B7` timestamp updated
  - `C5 = Success`
  - New row appended in run log area `J:N` with matching mode/scenario/status.

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
- Run `Run journal (Base)`.
- Expected:
  - Behavior matches Base default path.
  - No validation failures due solely to blank scenario.
