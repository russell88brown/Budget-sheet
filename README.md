# Budget Forecast Engine

Budget Forecast Engine is a **Google Apps Script application for Google Sheets** that projects future balances from your budgeting rules.

You define accounts, income, expenses, transfers, and optional policies, then run the menu actions to regenerate forecast outputs (`Journal`, `Daily`, `Monthly`, `Dashboard`) from scratch.

## What It Does

- Runs inside a Google Sheet via the **Budget Forecast** custom menu.
- Forecasts cash/debt movement forward in time using recurrence rules.
- Rebuilds outputs deterministically from sheet inputs.
- Supports export output for external sharing/processing.

## Documentation Index

### Setup

- `docs/CLASP.md`: Apps Script project setup, including:
  - Manual copy into the Apps Script editor
  - `clasp` push/pull workflow for synced development

### Development

- `docs/TECHNICAL.md`: full technical reference (all implemented functionality and behavior).
- `docs/CODEX.md`: local Codex development environment and repo hygiene notes.
- `docs/TEST_CASES.md`: manual regression tests, including scenario and setup-data validation.
- `docs/SCENARIOS.md`: how scenario support is integrated into setup/default data and runtime.

## Tech Stack

Mandatory to run:
- Google Sheets
- Google Apps Script (V8)
- Source files from `src/` (including `src/appsscript.json`)

For development and changes:
- Node.js LTS + npm
- `@google/clasp` (optional, for sync workflow)
- Local `.clasp.json` (from `.clasp.example.json`)
- Optional local Codex config in `codex/config.toml`

Note:
- `clasp` is not required to run the app. You can manually copy/upload files from `src/` into the Google Apps Script editor attached to your Google Sheet.
