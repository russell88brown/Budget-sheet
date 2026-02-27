# File-By-File TypeScript Migration Matrix

Date: 2026-02-27  
Scope: `src/*.gs` (23 files)

## Estimation Summary
- `src/*.gs` total: **10,642 LOC**
- Generated bundle [`src/B08_TypedBudget.generated.gs`](c:\Users\User\Dev\Budget-sheet\src\B08_TypedBudget.generated.gs): **1,702 LOC**
- `src` without generated bundle: **8,940 LOC**
- `ts/**/*.ts` total: **2,498 LOC**
- Estimated migrated to TypeScript (by maintained source LOC): **~27.9%** (`2,498 / 8,940`)

Notes:
- “Runtime-bound” means not a good fit for pure `ts/core`; it can still be authored as TS and transpiled for Apps Script.
- API-hit counts (`SpreadsheetApp`, `HtmlService`, `Utilities`, etc.) are directional, not exact partitioning.

## Matrix
| File | LOC | GAS API hits | Current State | Recommendation | Next Action |
|---|---:|---:|---|---|---|
| `A01_Setup.gs` | 1104 | 27 | Runtime setup/UI + sheet formatting | Runtime-bound | Keep in GAS runtime; optionally extract pure table/spec builders to `ts/core` later. |
| `A02_DefaultData.gs` | 464 | 2 | Mostly default seed data + sheet write paths | Split | Move pure seed/default object construction to `ts/core` and keep sheet write path in GAS. |
| `B01_Config.gs` | 70 | 0 | Constants only | Candidate | Move to TS shared constants (single source for adapters + core). |
| `B02_Schema.gs` | 370 | 0 | Schema metadata only | Candidate | Move to TS shared schema module and consume from runtime wrappers. |
| `B03_Utils.gs` | 47 | 2 | HtmlService helper wrappers | Runtime-bound | Keep in GAS runtime. |
| `B04_Recurrence.gs` | 136 | 1 | Wrapper over recurrence logic | Split (mostly migrated) | Continue shrinking fallback code; keep only runtime/date/timezone boundary helpers. |
| `B05_EventSort.gs` | 61 | 0 | Wrapper over typed sort functions | Split (mostly migrated) | Keep thin wrapper only; remove legacy branch once typed path is mandatory. |
| `B06_CoreModel.gs` | 44 | 0 | Core normalization wrappers | Split (mostly migrated) | Keep minimal wrapper, prefer typed-only path. |
| `B07_TypedAdapters.gs` | 1158 | 0 | Transitional bridge/fallback layer | Transitional | Reduce surface over time; delete legacy fallback sections after coverage confidence. |
| `B08_TypedBudget.generated.gs` | 1702 | 0 | Generated typed runtime bundle | Migrated/generated | Keep generated; do not hand-edit. |
| `C01_Readers.gs` | 251 | 2 | Sheet read + normalization mix | Split | Keep sheet extraction in GAS; move normalization/row mapping logic fully to TS. |
| `C02_RunModel.gs` | 40 | 0 | Run model assembly | Split (mostly migrated) | Completed 2026-02-27: logic moved to `ts/core/runModel.ts`; keep GAS wrapper boundary. |
| `C03_RunExtensions.gs` | 16 | 0 | Extension orchestration | Split (mostly migrated) | Completed 2026-02-27: logic moved to `ts/core/runExtensions.ts`; keep GAS wrapper boundary. |
| `D01_Events.gs` | 172 | 0 | Event builders and mapping | Split (mostly migrated) | Keep wrapper boundary; remove duplicated legacy event construction. |
| `D02_CoreCompile.gs` | 72 | 0 | Compile/sort orchestration | Split (mostly migrated) | Keep thin wrapper; lean on typed compile path. |
| `D03_CoreApply.gs` | 451 | 0 | Core apply pipeline with typed hooks | Split | Continue extracting pure algorithms to `ts/core/journal*`; keep runtime state and integration in GAS. |
| `D04_JournalEngine.gs` | 2048 | 25 | Large mixed engine (I/O + core logic) | Split (high priority) | In progress (2026-02-27): extracted Rule ID assignment logic to `ts/core/ruleIdAssignment.ts`; continue moving pure validation/selection transforms. |
| `D05_Writers.gs` | 202 | 5 | Journal write/formatting | Runtime-bound | Keep as GAS writer module. |
| `E01_Summary.gs` | 733 | 13 | Mixed summary compute + output formatting | Split | Move pure summary calculations to `ts/core`; keep rendering/writes/formatting in GAS. |
| `E02_DashboardReports.gs` | 476 | 11 | Dashboard pivot/report rendering | Runtime-bound | Keep as GAS reporting/UI writer. |
| `F01_Menu.gs` | 231 | 3 | Menu and dialog orchestration | Runtime-bound | Keep as GAS UI module. |
| `F03_Export.gs` | 330 | 16 | Export UI + blob/zip + date formatting | Runtime-bound | Keep GAS boundary; optional TS helper for pure shaping/metadata. |
| `Z01_FixtureTests.gs` | 464 | 0 | Apps Script deterministic fixtures | Split | Keep smoke fixtures in GAS, but prefer new behavior contracts in Node `tests/*.test.ts`. |

## Quick-Win Queue (Next 3)
1. `B01_Config.gs` + `B02_Schema.gs`: move to TS shared modules and expose through entry bundle. (Completed 2026-02-27)
2. `D04_JournalEngine.gs`: isolate pure decision logic into new `ts/core` modules and leave only sheet/runtime orchestration.
3. `E01_Summary.gs`: split compute (TS) from write/format/report rendering (GAS).
