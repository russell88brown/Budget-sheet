# `src/` Technical Map

## Section A: Setup (Operational)
- `A01_Setup.gs`: setup stages, validations, named ranges, setup audit/actions.
- `A02_DefaultData.gs`: default seed data and default tag catalog.
- `A03_SetupDialog.html`: setup audit/fix dialog.

## Section B: Utilities/Foundation (Utility)
- `B01_Config.gs`: constants, enums, sheet and range IDs.
- `B02_Schema.gs`: canonical sheet schema metadata.
- `B03_Utils.gs`: shared helper utilities + HTML template compatibility wrappers.
- `B04_Recurrence.gs`: recurrence expansion/date window helpers.
- `B05_EventSort.gs`: deterministic event precedence and tie-break ordering.
- `B06_CoreModel.gs`: shared normalization for core event model.

## Section C: Inputs + Run Model (Operational)
- `C01_Readers.gs`: reads and normalizes input rows.
- `C02_RunModel.gs`: builds run model for selected tag scope.
- `C03_RunExtensions.gs`: extension wiring (policies/goals).

## Section D: Journal Pipeline (Operational)
- `D01_Events.gs`: convert rules into normalized events.
- `D02_CoreCompile.gs`: compile and sort event stream.
- `D03_CoreApply.gs`: apply events to balances and journal rows.
- `D04_JournalEngine.gs`: orchestration, validation, preprocessing, account summaries, run metadata.
- `D05_Writers.gs`: journal sheet write/migration/formatting.

## Section E: Other Summaries + Dashboard (Operational)
- `E01_Summary.gs`: daily/monthly builders and reconciliation checks.
- `E02_DashboardReports.gs`: dashboard report registry + rendering/layout.

## Section F: Menu/UI/Export (Operational)
- `F01_Menu.gs`: menu entrypoints and run orchestration.
- `F02_RunDialog.html`: action + tag run dialog.
- `F03_Export.gs`: export operations and payload build.
- `F04_ExportDialog.html`: export dialog UI.

## Section Z: Tests
- `Z01_FixtureTests.gs`: deterministic fixture test suite.

## Other
- `appsscript.json`: Apps Script manifest.

## Notes
- Tag-first user model is active.
- Legacy `Scenario` column compatibility remains in readers/engine paths.
- Setup handlers (`runSetupAudit`, `runSetupActions`) are located in setup module (`A01_Setup.gs`).
