# Technical Reference

## Source Guide (from `src/README.md`)

This project is structured around operational pipeline stages plus shared utilities.

### App Flow
1. Setup builds sheets, rules, and defaults.
2. Inputs are read and scoped by tag.
3. Journal rows are generated from events.
4. Daily/Monthly summaries and dashboard are derived from Journal.
5. Menu/UI orchestrates runs and exports.

### Section Map

| Section | Classification | Purpose |
|---|---|---|
| `A` | Operational | Setup and defaults |
| `B` | Utility | Config, schema, shared helpers, typed adapter boundary |
| `C` | Operational | Input readers and run-model construction |
| `D` | Operational | Journal compile/apply/orchestration/writes |
| `E` | Operational | Daily/Monthly summaries and dashboard reports |
| `F` | Operational | Menu entrypoints, dialogs, export |
| `Z` | Operational test harness | Deterministic fixture tests |

## Canonical File Responsibilities

### A: Setup
- `src/A01_Setup.gs`: setup stages, validation rules, named ranges, setup audit/actions.
- `src/A02_DefaultData.gs`: default seed data and default tag catalog.
- `src/A03_SetupDialog.html`: setup audit/fix dialog.

### B: Utilities/Foundation
- `src/B01_Config.gs`: constants, enums, sheet and range IDs.
- `src/B02_Schema.gs`: canonical sheet schema metadata.
- `src/B03_Utils.gs`: shared helpers and template compatibility wrappers.
- `src/B04_Recurrence.gs`: recurrence/date/window helpers.
- `src/B05_EventSort.gs`: deterministic event precedence and tie-break ordering.
- `src/B06_CoreModel.gs`: core event normalization helpers.
- `src/B07_TypedAdapters.gs`: Apps Script -> typed runtime adapter boundary.
- `src/B08_TypedBudget.generated.gs`: generated typed runtime bundle.

### C: Inputs + Run Model
- `src/C01_Readers.gs`: input reads and normalization.
- `src/C02_RunModel.gs`: run-model builder by tag scope.
- `src/C03_RunExtensions.gs`: extension wiring (policies/goals).

### D: Journal Pipeline
- `src/D01_Events.gs`: input rules to normalized events.
- `src/D02_CoreCompile.gs`: event compile and sort.
- `src/D03_CoreApply.gs`: event apply to balances/journal rows.
- `src/D04_JournalEngine.gs`: orchestration, validation, preprocessing, run metadata.
- `src/D05_Writers.gs`: journal writing/migration/formatting.

### E: Other Summaries + Dashboard
- `src/E01_Summary.gs`: daily/monthly builders and reconciliation checks.
- `src/E02_DashboardReports.gs`: dashboard report registry and rendering.

### F: Menu/UI/Export
- `src/F01_Menu.gs`: menu entrypoints and run orchestration.
- `src/F02_RunDialog.html`: operation/tag selector dialog.
- `src/F03_Export.gs`: export operations.
- `src/F04_ExportDialog.html`: export UI.

### Z: Tests
- `src/Z01_FixtureTests.gs`: deterministic fixture tests.
- `tests/*.test.ts`: typed node tests for migrated modules.

## Typed Migration Pipeline

- Typed source lives in `ts/`.
- Migrated typed cores currently include:
  - `engine/runSelections`
  - `core/dateMath`
  - `core/eventSort`
  - `core/compiledEvent`
  - `core/recurrence`
  - `core/readerNormalization`
  - `core/eventBuilders`
  - `core/applyCalculations`
  - `core/policyRules`
  - `core/tagScope`
  - `core/summaryStats`
  - `core/summaryExplainability`
  - `core/monthlyRecurrence`
  - `core/transferMonthlyTotals`
  - `core/accountSummaries`
  - `core/accountValidation`
  - `core/journalNormalization`
  - `core/monthlyReconciliation`
  - `core/journalAssembly`
  - `core/journalApplyHelpers`
  - `core/journalRows`
  - `core/journalEventApplication`
  - `core/journalDeficitInterest`
  - `core/journalAutoDeficit`
  - `core/journalTransferResolution`
  - `core/journalOrchestration`
  - `core/journalBuild`
  - `core/journalMultiRun`
  - `core/journalRuntime`
  - `core/journalPipelineExecution`
  - `core/contracts`
- Build command: `npm run build:typed`.
- Typecheck command: `npm run typecheck`.
- Test command: `npm test`.
- Verify command: `npm run verify` (typecheck + tests + typed bundle generation).
- Generated output: `src/B08_TypedBudget.generated.gs`.
- Runtime uses `src/B07_TypedAdapters.gs` so migration can continue incrementally.

## Tag Model

- User-facing key is `Tag`.
- `Base` is always included in run selections.

## Determinism Guarantees

- Canonical same-day event precedence from `B05_EventSort.gs`.
- Stable tie-breaks for same-day events.
- Writer preserves generated order.
- Daily/Monthly reconciliation checks verify downstream consistency.
