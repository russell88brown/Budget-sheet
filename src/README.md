# `src/` Quick Map

- `config/`: constants and schema (`00_Config.gs`, `02_Schema.gs`)
- `ui/`: menu and dialogs (`01_Menu.gs`, `*.html`)
- `admin/`: setup/default data/export (`05_Setup.gs`, `06_DefaultData.gs`, `07_Export.gs`)
- `engine/`: readers, recurrence, events, sort order, forecast core (`10_Readers.gs`, `15_ScenarioModel.gs`, `20_Events.gs`, `30_Recurrence.gs`, `35_EventSort.gs`, `40_Engine.gs`, `Core_*.gs`)
- `reports/`: Journal + Daily/Monthly/Dashboard writers (`50_Writers.gs`, `60_Summary.gs`)
- `shared/`: cross-cutting helpers (`90_Utils.gs`)
- `tests/`: deterministic fixture tests (`98_FixtureTests.gs`)

Manifest:
- `appsscript.json`

Determinism guarantees (core paths):
- Event sorting uses one canonical same-day order list plus stable tie-breakers.
- Account summaries use the same transfer totals object that powers Transfers `Monthly Total` writes.
- Fixture runners in `src/tests/98_FixtureTests.gs` validate stable ordering and balance outcomes.
- Journal writer preserves generated row order (no post-write re-sort), so Daily/Monthly closings stay stable.
- Multi-scenario Daily/Monthly outputs include a `Scenario` column to avoid same-day scenario collisions.
