# `src/` Quick Map (Flat Layout)

All source files now live directly under `src/` and are grouped by numeric prefix.

- `01-03`: config + shared helpers (`01_Config.gs`, `02_Schema.gs`, `03_Utils.gs`)
- `10-19`: core engine (`10_Recurrence.gs`, `11_EventSort.gs`, `12_CoreModel.gs`, `13_Events.gs`, `14_CoreCompile.gs`, `15_CoreApply.gs`, `16_Readers.gs`, `17_RunModel.gs`, `18_RunExtensions.gs`, `19_Engine.gs`)
- `20-22`: output layers (`20_Writers.gs`, `21_Summary.gs`, `22_DashboardReports.gs`)
- `30-33`: UI menu/dialog files (`30_Menu.gs`, `31_ExportDialog.html`, `32_ScenarioRunDialog.html`, `33_SetupDialog.html`)
- `40-42`: admin/setup/export (`40_Setup.gs`, `41_DefaultData.gs`, `42_Export.gs`)
- `90`: deterministic fixture tests (`90_FixtureTests.gs`)
- `appsscript.json`: Apps Script manifest

Determinism guarantees (core paths):
- Event sorting uses one canonical same-day order list plus stable tie-breakers.
- Account summaries use the same transfer totals object that powers Transfers `Monthly Total` writes.
- Fixture runners in `src/90_FixtureTests.gs` validate stable ordering and balance outcomes.
- Journal writer preserves generated row order (no post-write re-sort), so Daily/Monthly closings stay stable.
- Multi-scenario Daily/Monthly outputs include a `Scenario` column to avoid same-day scenario collisions.

Core API shape:
- `buildRunModel_()` / `buildRunModelWithExtensions_()` in `17_RunModel.gs`
- `buildRunExtensions_()` in `18_RunExtensions.gs`
- `CoreCompileRules.buildSortedEvents()` in `14_CoreCompile.gs`
- `CoreApplyEvents.applyEventsToJournal()` in `15_CoreApply.gs`
- Compatibility wrapper remains: `Engine.runJournalForScenarioModel` in `19_Engine.gs`

