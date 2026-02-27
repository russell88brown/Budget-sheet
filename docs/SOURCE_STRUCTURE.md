# Source Structure Guide

This document explains how `src/` is organized so users, administrators, and maintainers can find the right code quickly.

## Goals

- Keep runtime behavior unchanged while making the codebase easier to navigate.
- Separate user-facing UI/setup concerns from forecast engine internals.
- Keep Apps Script/clasp compatibility (`src/**` remains the deploy root).

## Flat Layout

`src/` is now flat (no subfolders) and grouped by numeric prefixes:

- `01-03`: config + shared helpers (`01_Config.gs`, `02_Schema.gs`, `03_Utils.gs`)
- `10-19`: core engine (`10_Recurrence.gs` through `19_Engine.gs`)
- `20-22`: output/reporting (`20_Writers.gs`, `21_Summary.gs`, `22_DashboardReports.gs`)
- `30-33`: UI (`30_Menu.gs`, `31_ExportDialog.html`, `32_ScenarioRunDialog.html`, `33_SetupDialog.html`)
- `40-42`: admin/setup/export (`40_Setup.gs`, `41_DefaultData.gs`, `42_Export.gs`)
- `90`: deterministic fixtures (`90_FixtureTests.gs`)
- `appsscript.json`: Apps Script manifest.

## Where To Start

- New user issue with menu actions: `src/30_Menu.gs`.
- Setup/data-validation issue: `src/40_Setup.gs`.
- Forecast math or rule behavior: `src/10_Recurrence.gs` to `src/19_Engine.gs`.
- Output rendering issue (Journal/Daily/Monthly/Dashboard): `src/20_Writers.gs` and `src/21_Summary.gs`.
- Regression verification: `src/90_FixtureTests.gs`.

## Notes For Administrators

- `clasp` deploys from `src/`; flat layout simplifies file discovery and editor ordering.
- Existing CI triggers on `src/**`, so this structure stays compatible with current workflows.
- Manual copy workflows should copy all `.gs` and `.html` files in `src/`.

