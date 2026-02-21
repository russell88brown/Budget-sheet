# Scenario Setup Integration

This document describes how scenario support is integrated into setup and default data.

## Setup Integration

- Setup stage `Validation + settings` now seeds the scenario catalog in `Settings!H2:H`.
- Default seeded values:
  - `Base`
  - `Stress`
- Named range `ScenarioList` is bound to `Settings!H2:H`.
- Input sheets with `Scenario` column use this named range for data validation.

## Default Data Integration

- `Load default data` ensures the scenario catalog exists before writing input rows.
- If a row is missing `Scenario`, writer logic defaults it to `Base`.
- This keeps older datasets compatible while enabling scenario-specific rows immediately.

## Run-Time Integration

- Journal and summaries can be run for a selected scenario from the menu.
- Scenario runs filter inputs before event generation.
- Journal output includes `Scenario` to preserve traceability in exports and summaries.
- Setup now exposes run metadata fields in `Settings`:
  - `Last Run Mode` (`B5`)
  - `Last Run Scenario` (`B6`)
  - `Last Run At` (`B7`)
  - `Status` (`C5`)
- Run history log is appended in `Settings` (no extra sheet):
  - Headers in `J1:N1`
  - Data rows appended from `J2:N` (`Run At`, `Mode`, `Scenario`, `Status`, `Notes`)
