# File-By-File TypeScript Migration Matrix

Date: 2026-02-27  
Scope: `src/*.gs` (23 files)

## Estimation Summary
- `src/*.gs` total: **11,362 LOC**
- Generated bundle `src/B08_TypedBudget.generated.gs`: **2,576 LOC**
- `src` without generated bundle: **8,786 LOC**
- `ts/**/*.ts` total: **3,629 LOC**
- Estimated migrated to TypeScript (by maintained source LOC): **~41.3%** (`3,629 / 8,786`)

Notes:
- "Runtime-bound" means not a good fit for pure `ts/core`; it can still be authored in TS and transpiled for Apps Script.
- GAS API-hit counts (`SpreadsheetApp`, `HtmlService`, `Utilities`, etc.) are directional, not exact partitioning.

## Matrix
| File | LOC | GAS API hits | Current State | Recommendation | Next Action |
|---|---:|---:|---|---|---|
| `A01_Setup.gs` | 1104 | 28 | Runtime setup/UI + sheet formatting | Runtime-bound | Keep in GAS runtime; optionally extract pure table/spec builders to `ts/core` later. |
| `A02_DefaultData.gs` | 464 | 5 | Mostly default seed data + sheet write paths | Split | Move pure seed/default object construction to `ts/core`; keep sheet write path in GAS. |
| `B01_Config.gs` | 14 | 0 | Thin wrapper to typed `Config` export | Split (mostly migrated) | Completed wrapper-thin step; keep only typed export resolution and remove legacy fallback if no longer needed. |
| `B02_Schema.gs` | 14 | 0 | Thin wrapper to typed `Schema` export | Split (mostly migrated) | Completed wrapper-thin step; keep only typed export resolution and remove legacy fallback if no longer needed. |
| `B03_Utils.gs` | 47 | 2 | HtmlService helper wrappers | Runtime-bound | Keep in GAS runtime. |
| `B04_Recurrence.gs` | 136 | 1 | Wrapper over recurrence logic | Split (mostly migrated) | Continue shrinking fallback code; keep only runtime/date/timezone boundary helpers. |
| `B05_EventSort.gs` | 61 | 0 | Wrapper over typed sort functions | Split (mostly migrated) | Keep thin wrapper only; remove legacy branch once typed path is mandatory. |
| `B06_CoreModel.gs` | 44 | 0 | Core normalization wrappers | Split (mostly migrated) | Keep minimal wrapper, prefer typed-only path. |
| `B07_TypedAdapters.gs` | 1306 | 0 | Transitional bridge/fallback layer | Transitional | Reduce adapter surface over time; remove legacy fallback sections after parity confidence. |
| `B08_TypedBudget.generated.gs` | 2576 | 0 | Generated typed runtime bundle | Migrated/generated | Keep generated; do not hand-edit. |
| `C01_Readers.gs` | 251 | 2 | Sheet read + normalization mix | Split | Keep sheet extraction in GAS; move remaining normalization/row mapping logic fully to TS. |
| `C02_RunModel.gs` | 79 | 0 | Wrapper to typed run-model assembly | Split (mostly migrated) | Completed 2026-02-27: keep GAS wrapper boundary only. |
| `C03_RunExtensions.gs` | 27 | 0 | Wrapper to typed run-extension shaping | Split (mostly migrated) | Completed 2026-02-27: keep GAS wrapper boundary only. |
| `D01_Events.gs` | 172 | 0 | Event builders and mapping wrappers | Split (mostly migrated) | Keep wrapper boundary; remove duplicated legacy event construction when safe. |
| `D02_CoreCompile.gs` | 72 | 0 | Compile/sort orchestration wrappers | Split (mostly migrated) | Keep thin wrapper; lean on typed compile path. |
| `D03_CoreApply.gs` | 451 | 0 | Core apply pipeline with typed hooks | Split | Continue extracting pure algorithms to `ts/core/journal*`; keep runtime state/integration in GAS. |
| `D04_JournalEngine.gs` | 2108 | 25 | Large mixed engine (I/O + core logic), partially extracted | Split (high priority) | Continue with remaining pure selection/normalization/orchestration transforms; keep sheet I/O in GAS (transfer/recurrence/account row normalization, shared row-deactivation, monthly income/expense totals, transfer monthly totals, and transfer monthly worksheet calculations also extracted to TS on 2026-02-27). |
| `D05_Writers.gs` | 202 | 5 | Journal write/formatting | Runtime-bound | Keep as GAS writer module. |
| `E01_Summary.gs` | 733 | 13 | Mixed summary compute + output formatting | Split | Move pure summary calculations to `ts/core`; keep rendering/writes/formatting in GAS. |
| `E02_DashboardReports.gs` | 476 | 11 | Dashboard pivot/report rendering | Runtime-bound | Keep as GAS reporting/UI writer. |
| `F01_Menu.gs` | 231 | 3 | Menu and dialog orchestration | Runtime-bound | Keep as GAS UI module. |
| `F03_Export.gs` | 330 | 17 | Export UI + blob/zip + date formatting | Runtime-bound | Keep GAS boundary; optional TS helper for pure shaping/metadata. |
| `Z01_FixtureTests.gs` | 464 | 0 | Apps Script deterministic fixtures | Split | Keep smoke fixtures in GAS; prefer behavior contracts in Node `tests/*.test.ts`. |

## Reconciliation Notes
- `B01_Config.gs` and `B02_Schema.gs` are now thin typed wrappers (not pending candidates).
- `C02_RunModel.gs` and `C03_RunExtensions.gs` remain wrapper-bound with typed-first implementation complete.
- `D04_JournalEngine.gs` has extracted modules for rule IDs, scenario disable, account lookup/validation, policy/goal row validation, income/transfer/expense row validation callbacks, transfer-row normalization, recurrence-row normalization, account-row normalization, shared row deactivation, monthly income/expense rule totals, transfer monthly rule totals, and transfer monthly worksheet calculations.

## Next Actions
1. Continue `D04_JournalEngine.gs` decomposition by extracting remaining pure pre-processing/orchestration transforms into `ts/core` modules, then keep GAS as sheet/runtime boundary only.
2. Reduce `B07_TypedAdapters.gs` fallback surface by deleting dead fallback paths that are now covered by typed exports and tests.
3. Split `C01_Readers.gs` so only sheet I/O stays in GAS and all normalization/mapping is typed and unit-tested.
4. Start `E01_Summary.gs` extraction by moving pure daily/monthly summary calculations into `ts/core`, keeping report rendering and write paths in GAS.
5. Expand typed API surface tests for each new extraction before removing matching GAS fallback branches.
