# Sprint Plan: 2026-02-27_feat_typescript-migration-2

## Metadata
- Sprint ID: `2026-02-27_feat_typescript-migration-2`
- Start date (YYYY-MM-DD): 2026-02-27
- End date (YYYY-MM-DD): 2026-02-27
- Owner: Codex + User
- Branch: `feat/typescript-migration-2`

## Objective
Produce a file-by-file migration matrix for `src/*.gs` that estimates current TypeScript migration coverage and identifies what should move to `ts/core`, what should remain Apps Script runtime, and what should be split.

## Desired End State
- TypeScript (`ts/core/*`) owns most business logic and is covered by Node tests.
- `src/*.gs` is primarily runtime boundary code (SpreadsheetApp/UI/triggers/I/O wrappers).
- Typed exports in `ts/apps-script/entry.ts` are the integration surface for GAS wrappers.

## Scope In
- Inventory all `src/*.gs` files with line counts.
- Classify each file into one of: `Already migrated/generated`, `Split (core + runtime)`, `Runtime-bound`.
- Provide explicit per-file recommendation and next action.
- Record migration estimate totals and boundaries.

## Scope Out
- No behavior/code refactors in production runtime files.
- No immediate module moves in this sprint; planning/documentation only.

## Task Checklist
- [x] Collect source inventory and baseline counts.
- [x] Build per-file migration matrix with target track and rationale.
- [x] Summarize migrated vs remaining/runtme-bound estimates.
- [x] Capture results in sprint PR notes.
- [x] Execute quick-win extraction for `B01_Config.gs` + `B02_Schema.gs` into shared TypeScript modules.
- [x] Regenerate typed bundle and keep GAS runtime wrappers aligned.
- [x] Move `C02_RunModel.gs` orchestration logic into typed core with GAS wrapper integration.
- [x] Move `C03_RunExtensions.gs` extension shaping logic into typed core with GAS wrapper integration.
- [x] Extract `D04_JournalEngine.gs` Rule ID assignment logic to typed core and keep GAS fallback.
- [x] Extract `D04_JournalEngine.gs` unknown-scenario row disable transform to typed core and keep GAS fallback.
- [x] Extract `D04_JournalEngine.gs` account lookup/validation row transforms to typed core and keep GAS fallback.
- [x] Extract `D04_JournalEngine.gs` policy-row validation transform to typed core and keep GAS fallback.
- [x] Extract `D04_JournalEngine.gs` goal-row validation transform to typed core and keep GAS fallback.
- [x] Extract `D04_JournalEngine.gs` income/transfer/expense row validation callbacks to typed core and keep GAS fallback.
- [x] Extract `D04_JournalEngine.gs` policy-row validation transform to typed core and keep GAS fallback.
- [x] Extract `D04_JournalEngine.gs` transfer-row normalization transform to typed core and keep GAS fallback.
- [x] Extract `D04_JournalEngine.gs` recurrence-row normalization transform to typed core and keep GAS fallback.
- [x] Extract `D04_JournalEngine.gs` account-row normalization transform to typed core and keep GAS fallback.
- [x] Extract `D04_JournalEngine.gs` shared row-deactivation loop to typed core and keep GAS fallback.
- [x] Extract `D04_JournalEngine.gs` income/expense monthly-rule total builders to typed core and keep GAS fallback.
- [x] Extract `D04_JournalEngine.gs` transfer monthly-rule total builder to typed core and keep GAS fallback.
- [x] Extract `D04_JournalEngine.gs` transfer monthly worksheet row-calculation loop to typed core and keep GAS fallback.
- [x] Extract `D04_JournalEngine.gs` income/expense monthly worksheet row-calculation loop to typed core and keep GAS fallback.
- [x] Extract `D04_JournalEngine.gs` account-balance map builder helper to typed core and keep GAS fallback.
- [x] Extract `D04_JournalEngine.gs` account lookup-map builder helper to typed core and keep GAS fallback.
- [x] Extract `D04_JournalEngine.gs` account monthly-flow worksheet row-calculation loop to typed core and keep GAS fallback.
- [x] Extract `D04_JournalEngine.gs` run-log note composition helper to typed core and keep GAS fallback.
- [x] Extract `D04_JournalEngine.gs` duplicate-account-name fallback helper to typed core and keep GAS fallback.
- [x] Extract `D04_JournalEngine.gs` run-log write-row selection helper to typed core and keep GAS fallback.
- [x] Extract `D04_JournalEngine.gs` run-log entry row builder helper to typed core and keep GAS fallback.
- [x] Extract shared D04 row-scenario matching helper to typed core and keep GAS fallback.
- [x] Extract duplicate-account error message formatter helper to typed core and keep GAS fallback.
- [x] Extract `C01_Readers.gs` sheet-row object mapping/filter helper to typed core and keep GAS fallback.
- [x] Extract `C01_Readers.gs` scenario-catalog builder helper to typed core and keep GAS fallback.
- [x] Extract `C01_Readers.gs` account-row reader mapping helper to typed core and keep GAS fallback.
- [x] Extract `C01_Readers.gs` policy-row reader mapping helper to typed core and keep GAS fallback.

## Acceptance Criteria
- Every `src/*.gs` file is represented exactly once in the matrix.
- Matrix includes recommendation and concrete next action per file.
- Totals for `src` LOC and `ts` LOC are included with an explicit estimation method.

## Constraints
- Keep recommendations pragmatic for the current architecture (`B07` adapters + generated `B08`).
- Distinguish “cannot move to pure `ts/core`” from “can still be authored in TypeScript and transpiled for GAS”.

## Definition Of Done
- [x] Planned scope implemented
- [x] Validation/test evidence recorded
- [x] `PR.md` updated with evidence

## Risks And Mitigations
- Risk: Simple API-hit counting overestimates runtime-bound code.
  Mitigation: Mark counts as directional and provide qualitative split recommendations.
- Risk: Naming overlap may imply migration when only wrappers changed.
  Mitigation: Include per-file “next action” to clarify exact migration intent.

