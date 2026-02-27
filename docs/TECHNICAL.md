# Technical Reference

## Source Architecture Map (Canonical)

This section is the canonical top-of-doc architecture map and mirrors `src/README.md`.

### Section A: Setup (Operational)
- `src/A01_Setup.gs`: setup stages, validations, named ranges, setup audit/actions.
- `src/A02_DefaultData.gs`: default seed data and default tag catalog.
- `src/A03_SetupDialog.html`: setup audit/fix dialog.

### Section B: Utilities/Foundation (Utility)
- `src/B01_Config.gs`: constants, enums, sheet and range IDs.
- `src/B02_Schema.gs`: canonical sheet schema metadata.
- `src/B03_Utils.gs`: shared helpers and template compatibility wrappers.
- `src/B04_Recurrence.gs`: recurrence/date/window helpers.
- `src/B05_EventSort.gs`: deterministic event precedence and tie-break ordering.
- `src/B06_CoreModel.gs`: core event normalization helpers.

### Section C: Inputs + Run Model (Operational)
- `src/C01_Readers.gs`: input reads and normalization.
- `src/C02_RunModel.gs`: run-model builder by tag scope.
- `src/C03_RunExtensions.gs`: extension wiring (policies/goals).

### Section D: Journal Pipeline (Operational)
- `src/D01_Events.gs`: input rules to normalized events.
- `src/D02_CoreCompile.gs`: event compile and sort.
- `src/D03_CoreApply.gs`: event apply to balances/journal rows.
- `src/D04_JournalEngine.gs`: orchestration, validation, preprocessing, run metadata.
- `src/D05_Writers.gs`: journal writing/migration/formatting.

### Section E: Other Summaries + Dashboard (Operational)
- `src/E01_Summary.gs`: daily/monthly builders and reconciliation checks.
- `src/E02_DashboardReports.gs`: dashboard report registry and rendering.

### Section F: Menu/UI/Export (Operational)
- `src/F01_Menu.gs`: menu entrypoints and run orchestration.
- `src/F02_RunDialog.html`: operation/tag selector dialog.
- `src/F03_Export.gs`: export operations.
- `src/F04_ExportDialog.html`: export UI.

### Section Z: Tests
- `src/Z01_FixtureTests.gs`: deterministic fixture tests.

---

## Runtime Flow

1. Setup (`A01`/`A02`) prepares sheets, rules, named ranges, and defaults.
2. Readers/run model (`C01`-`C03`) load scoped inputs for selected tag set.
3. Journal pipeline (`D01`-`D05`) builds deterministic journal rows.
4. Summaries/dashboard (`E01`/`E02`) derive reporting outputs from Journal.
5. Menu/UI/export (`F01`-`F04`) orchestrates user actions.

## Tag Model

- User-facing key is `Tag`.
- Base tag is always included in run selections.
- Compatibility for legacy `Scenario` columns is retained.

## Determinism Guarantees

- Canonical same-day event precedence from `B05_EventSort.gs`.
- Stable tie-breaks for same-day events.
- Journal writer preserves generated row order.
- Daily/Monthly reconciliation checks verify downstream consistency.

## Setup And Validation

- Setup actions: structure, validation/settings, theme, reorder, defaults.
- Integrity checks disable invalid included rows before journal build.
- Run metadata and run log are written to `Settings`.

## Export And Tests

- Export supports selected sheet payloads via zip/json flow.
- Deterministic fixture suite in `Z01_FixtureTests.gs` validates stable behavior.
