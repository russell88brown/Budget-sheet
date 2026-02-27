# TypeScript Migration Matrix (High-Level)

Date: 2026-02-28  
Scope: `src/*.gs` (23 files)

## Progress Stats
- `src/*.gs` total: **11,817 LOC**
- Generated bundle `src/B08_TypedBudget.generated.gs`: **2,576 LOC**
- Maintained GAS source (`src` minus generated bundle): **9,241 LOC**
- Typed source (`ts/**/*.ts`): **4,444 LOC**

## Migration Numbers (Explicit Denominators)
### View A: Entire Maintained `src` Base (9,241 LOC = 100%)
- Migrated to TS: **4,444 LOC (48.1%)**
- Will stay in GAS (runtime-bound): **2,390 LOC (25.9%)**
- Remaining migratable: **2,407 LOC (26.0%)**

Check:
- `4,444 + 2,390 + 2,407 = 9,241`
- `48.1% + 25.9% + 26.0% = 100%`

### View B: Eligible Migration Base Only (6,851 LOC = 100%)
- Already migrated: **4,444 LOC (64.9%)**
- Still to migrate: **2,407 LOC (35.1%)**

Definitions:
- Eligible migration base = `maintained src - runtime-bound src` = `9,241 - 2,390 = 6,851`.
- Runtime-bound files are intentionally excluded from “still to migrate.”

## Status Buckets
### Migrated (or mostly migrated)
- `B01_Config.gs`, `B02_Schema.gs`, `B04_Recurrence.gs`, `B05_EventSort.gs`, `B06_CoreModel.gs`
- `B08_TypedBudget.generated.gs` (generated output)
- `C02_RunModel.gs`, `C03_RunExtensions.gs`, `D01_Events.gs`, `D02_CoreCompile.gs`
- Parts of `D04_JournalEngine.gs` already extracted to `ts/core/*`

### Yet To Be Migrated (next extraction targets)
- `D04_JournalEngine.gs` remaining pure orchestration/selection logic
- `D03_CoreApply.gs` remaining pure algorithm paths
- `C01_Readers.gs` normalization/mapping paths
- `E01_Summary.gs` pure summary compute logic
- `A02_DefaultData.gs` pure seed-data construction logic
- `Z01_FixtureTests.gs` behavior-contract coverage migration to Node tests

### Will Stay The Same (GAS runtime-bound)
- `A01_Setup.gs`, `B03_Utils.gs`, `D05_Writers.gs`, `E02_DashboardReports.gs`, `F01_Menu.gs`, `F03_Export.gs`

Rationale:
- These are UI/sheet/runtime integration boundaries and should remain Apps Script entry/write/orchestration layers.

## File Matrix
| File | Status | Plan |
|---|---|---|
| `A01_Setup.gs` | Stay in GAS | Keep runtime setup/UI + formatting in GAS. |
| `A02_DefaultData.gs` | To migrate (partial) | Move pure default-data construction to TS; keep sheet writes in GAS. |
| `B01_Config.gs` | Migrated (mostly) | Keep as thin wrapper over typed export. |
| `B02_Schema.gs` | Migrated (mostly) | Keep as thin wrapper over typed export. |
| `B03_Utils.gs` | Stay in GAS | Keep HtmlService/runtime helpers in GAS. |
| `B04_Recurrence.gs` | Migrated (mostly) | Keep wrapper boundary; trim fallback over time. |
| `B05_EventSort.gs` | Migrated (mostly) | Keep wrapper boundary; trim fallback over time. |
| `B06_CoreModel.gs` | Migrated (mostly) | Keep wrapper boundary; prefer typed path. |
| `B07_TypedAdapters.gs` | To migrate (reduce) | Reduce adapter/fallback surface as parity confidence increases. |
| `B08_TypedBudget.generated.gs` | Migrated (generated) | Keep generated; do not hand-edit. |
| `C01_Readers.gs` | To migrate (partial) | Move normalization/mapping to TS; keep sheet reads in GAS. |
| `C02_RunModel.gs` | Migrated (mostly) | Keep as typed wrapper boundary. |
| `C03_RunExtensions.gs` | Migrated (mostly) | Keep as typed wrapper boundary. |
| `D01_Events.gs` | Migrated (mostly) | Keep wrapper boundary; continue legacy removal. |
| `D02_CoreCompile.gs` | Migrated (mostly) | Keep wrapper boundary; continue legacy removal. |
| `D03_CoreApply.gs` | To migrate (partial) | Continue extracting pure algorithms into `ts/core`. |
| `D04_JournalEngine.gs` | To migrate (high priority, partial done) | Continue extracting remaining pure logic; keep sheet I/O in GAS. |
| `D05_Writers.gs` | Stay in GAS | Keep writer/formatting runtime boundary in GAS. |
| `E01_Summary.gs` | To migrate (partial) | Move pure summary calculations to TS; keep writes/rendering in GAS. |
| `E02_DashboardReports.gs` | Stay in GAS | Keep dashboard/report rendering in GAS. |
| `F01_Menu.gs` | Stay in GAS | Keep menu/dialog orchestration in GAS. |
| `F03_Export.gs` | Stay in GAS | Keep export runtime + blob/zip integrations in GAS. |
| `Z01_FixtureTests.gs` | To migrate (partial) | Keep smoke fixtures in GAS; move behavior contracts to Node tests. |

## Immediate Next Actions
1. Continue `D04_JournalEngine.gs` extraction of remaining pure orchestration logic.
2. Reduce `B07_TypedAdapters.gs` fallback branches now covered by tests.
3. Continue `C01_Readers.gs` normalization extraction to typed modules.
4. Start `E01_Summary.gs` compute extraction to typed core.
