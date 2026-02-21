# Scenario Setup Integration

This document describes the implementation details behind scenario support.

For user-facing examples and case studies, see `README.md`.

## Setup Integration

- Setup stage `Validation + settings` now seeds the scenario catalog in `Settings!H2:H`.
- Default seeded values:
  - `Base`
  - `Stress`
- Named range `ScenarioList` is bound to `Settings!H2:H`.
- Input sheets with `Scenario` column use this named range for data validation.

Scenario-capable input sheets:
- `Accounts`
- `Income`
- `Expense`
- `Transfers`
- `Policies`
- `Goals`
- `Risk`

## Default Data Integration

- `Load default data` ensures the scenario catalog exists before writing input rows.
- If a row is missing `Scenario`, writer logic defaults it to `Base`.
- This keeps older datasets compatible while enabling scenario-specific rows immediately.

## Run-Time Integration

- Journal and summaries can be run for a selected scenario from the menu.
- Scenario runs filter inputs before event generation.
- Journal output includes `Scenario` to preserve traceability in exports and summaries.
- Scenario buttons in menu:
  - `Run Main Scenario...`:
    - popup with action checkboxes (`Journal`, `Summaries`)
    - runs selected actions against `Base`
  - `Run Custom Scenario(s)...`:
    - popup with action checkboxes (`Journal`, `Summaries`)
    - multi-select scenario list from `ScenarioList`
- Setup now exposes run metadata fields in `Settings`:
  - `Last Run Mode` (`B5`)
  - `Last Run Scenario` (`B6`)
  - `Last Run At` (`B7`)
  - `Status` (`C5`)
- Run history log is appended in `Settings` (no extra sheet):
  - Headers in `J1:N1`
  - Data rows appended from `J2:N` (`Run At`, `Mode`, `Scenario`, `Status`, `Notes`)

## Validation Behavior

- If an included row has an unknown scenario, the row is auto-disabled (`Include=false`).
- The run surfaces feedback via toast.
- Unknown-scenario disable counts are written into run log notes when present.
