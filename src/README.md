# `src/` Quick Map

- `config/`: constants and schema (`00_Config.gs`, `02_Schema.gs`)
- `ui/`: menu and dialogs (`01_Menu.gs`, `*.html`)
- `admin/`: setup/default data/export (`05_Setup.gs`, `06_DefaultData.gs`, `07_Export.gs`)
- `engine/`: readers, recurrence, events, forecast core (`10_Readers.gs`, `15_ScenarioModel.gs`, `20_Events.gs`, `30_Recurrence.gs`, `40_Engine.gs`, `Core_*.gs`)
- `reports/`: Journal + Daily/Monthly/Dashboard writers (`50_Writers.gs`, `60_Summary.gs`)
- `shared/`: cross-cutting helpers (`90_Utils.gs`)
- `tests/`: deterministic fixture tests (`98_FixtureTests.gs`)

Manifest:
- `appsscript.json`
