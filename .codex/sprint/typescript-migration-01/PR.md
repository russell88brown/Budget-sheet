# PR Note: TypeScript Migration Foundation

## Summary
- Introduces TypeScript migration foundation with low-risk adapter wiring.
- Keeps Apps Script runtime stable with typed adapter boundaries and typed-required journal runtime.
- Adds typed recurrence, reader-normalization, event-builder, apply-calculation, policy-rule, tag-scope, summary-stats, summary-explainability, monthly-recurrence, transfer-monthly-total, account-summary, account-validation, journal-normalization, monthly-reconciliation, journal-assembly, journal-apply-helper, journal-row, journal-event-application, journal-deficit-interest, journal-auto-deficit, journal-transfer-resolution, journal-orchestration, journal-build, journal-multi-run, journal-runtime, journal-pipeline-execution, and boundary contracts utilities with tests.

## Implemented
- TS build/test foundation (`tsconfig`, scripts, typed modules, tests).
- Typed adapters in `src/B07_TypedAdapters.gs`.
- Typed runtime baseline file: `src/B08_TypedBudget.generated.gs`.
- Runtime wiring for:
  - run action/tag selection
  - date helpers
  - event sort
  - compiled event normalize/compare
  - recurrence helpers (`B04` routes through typed adapters)
  - reader normalization helpers (`C01` routes through typed adapters)
  - event builders (`D01` routes through typed adapters)
  - transfer resolution + fee helpers (`D03` routes through typed adapters)
  - policy applicability helpers (`D03` routes through typed adapters)
  - tag-scope filtering/set helpers (`D04`/`E01` route through typed adapters)
  - summary math helpers (`E01` routes through typed adapters)
  - negative-cash explainability aggregation (`E01` routes through typed adapters)
  - monthly recurrence factor/recurring checks (`D04` routes through typed adapters)
  - transfer monthly-total decision/resolution helpers (`D04` routes through typed adapters)
  - account-summary normalization/indexing/interest helpers (`D04` routes through typed adapters)
  - duplicate account-name detection helper (`D04` routes through typed adapters)
  - legacy frequency + account normalization helpers (`D04` routes through typed adapters)
  - monthly-vs-daily reconciliation helper (`E01` routes through typed adapters)
  - journal artifact merge + transaction-type/account-type helpers (`D04` and `D03` route through typed adapters)
  - journal apply balance/forecast/alerts helpers (`D03` routes through typed adapters)
  - journal opening/event row construction helpers (`D03` routes through typed adapters)
  - journal event snapshot application + clone/account-type-key helpers (`D03` routes through typed adapters)
  - deficit-coverage need + interest accrual/posting helpers (`D03` routes through typed adapters)
  - auto-deficit cover row generation helper (`D03` routes through typed adapters)
  - transfer resolution journal side-effects (skip/apply/warning) helper (`D03` routes through typed adapters)
  - run-id normalization + journal base-column resolution helpers (`D04` routes through typed adapters)
  - shared run-model-to-journal-artifacts builder (`D04` routes through typed adapters and pipeline)
  - multi-tag journal payload assembly helper (`D04` routes through typed adapters)
  - journal runtime helpers and typed pipeline execution wiring (`D04` routes through typed adapters)

## Local Validation Steps
1. `npm install`
2. `npm run verify`
3. Confirm generated bundle updated if needed:
   - `src/B08_TypedBudget.generated.gs`

## Notes
- Typed journal paths now fail fast when typed runtime is unavailable (`npm run build:typed`).
- Strict-mode sweep applied:
  - adapters now enforce typed-runtime-only execution (missing typed methods throw immediately),
  - `Tag` is now the only accepted input header for scope selection (`Scenario` alias removed),
  - setup/remap and reader compatibility aliases for `Scenario` were removed as a deliberate breaking change.

## Definition Of Done (Merge Checklist)

### 1) Typed build is reproducible
- [x] Single command builds typed runtime: `npm run build:typed`.
- [x] Single command validates typecheck + tests + typed build: `npm run verify`.
- [x] Generated bundle is committed and treated as generated output:
  - `src/B08_TypedBudget.generated.gs`

### 2) Typed adapters are the only integration point
- [x] Apps Script runtime calls typed runtime through `src/B07_TypedAdapters.gs`.
- [x] Journal runtime paths are typed-required (fail-fast if typed bundle unavailable).
- [x] Final sweep to remove remaining non-journal fallback branches where TS equivalent already exists.

### 3) Stable behavior is locked
- [x] Deterministic fixture suite exists in Apps Script runtime:
  - `src/Z01_FixtureTests.gs`
- [x] Typed unit test suite covers migrated modules:
  - `tests/*.test.ts`
- [x] Explicitly document and pin "golden scenario" fixture in this PR as the parity gate.
  - Pinned function: `runDeterministicFixtureTests_GoldenScenario`
  - Current target fixture: `runDeterministicFixtureTests_FixtureI`

### 4) Apps Script smoke still passes
- [x] Branch CI runs verify + branch Apps Script fixture execution:
  - `.github/workflows/pr-test.yml`
- [x] Add explicit manual smoke checklist output to this PR before merge:
  - run completes
  - journal produced
  - daily/monthly reconciliation passes
  - no runtime exceptions

#### Manual Smoke Output (Pre-Merge)
- Run date: `2026-02-27`
- Runner: `TBD (maintainer to execute in Apps Script UI)`
- [ ] Run completes
- [ ] Journal produced
- [ ] Daily/Monthly reconciliation passes
- [ ] No runtime exceptions

### 5) Debt-reduction priorities
- [x] Pure logic moved to TS core modules; GAS runtime is now mostly orchestration/IO.
- [x] Journal core duplication reduced; legacy writer migration path removed.
- [x] Freeze boundary contracts for `Event`, `Account`, `Policy`, `JournalRow` with shared exported types and adapter checks.
  - `ts/core/contracts.ts`
  - enforced in `ts/core/journalBuild.ts`

### Ready-To-Merge Gate
- [ ] All checklist items above complete (manual smoke checkboxes still need maintainer execution).
