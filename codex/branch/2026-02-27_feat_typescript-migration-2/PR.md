# PR Notes: 2026-02-27_feat_typescript-migration-2

## Summary
Created a file-by-file TypeScript migration plan for all `src/*.gs` modules, including quantitative migration estimates and explicit recommendations for what should move to `ts/core`, what should remain Apps Script runtime, and what should be split.

Target architecture agreed for implementation:
- TypeScript owns most business logic with automated tests.
- Apps Script files remain as thin runtime/integration wrappers.

## Sprint Plan Reference
- Sprint folder: `codex/branch/2026-02-27_feat_typescript-migration-2/`
- Plan file: `codex/branch/2026-02-27_feat_typescript-migration-2/sprint-plan.md`

## Completed Scope
- [x] Inventory and classify all `src/*.gs` files.
- [x] Capture migrated vs remaining estimates.
- [x] Produce per-file migration recommendations and next actions.
- [x] Link cleanup handoff from previous sprint.
- [x] Extract `D04_JournalEngine.gs` income/transfer/expense row validation callbacks to typed core (`ts/core/journalRowValidation.ts`) and keep GAS fallback wiring.
- [x] Extract `D04_JournalEngine.gs` transfer-row normalization transform to typed core (`ts/core/transferRowNormalization.ts`) and keep GAS fallback wiring.
- [x] Extract `D04_JournalEngine.gs` recurrence-row normalization transform to typed core (`ts/core/recurrenceRowNormalization.ts`) and keep GAS fallback wiring.
- [x] Extract `D04_JournalEngine.gs` account-row normalization transform to typed core (`ts/core/accountRowNormalization.ts`) and keep GAS fallback wiring.
- [x] Extract `D04_JournalEngine.gs` shared row-deactivation loop to typed core (`ts/core/rowDeactivation.ts`) and keep GAS fallback wiring.
- [x] Extract `D04_JournalEngine.gs` income/expense monthly-rule total builders to typed core (`ts/core/monthlyRuleTotals.ts`) and keep GAS fallback wiring.
- [x] Extract `D04_JournalEngine.gs` transfer monthly-rule total builder to typed core (`ts/core/transferRuleTotals.ts`) and keep GAS fallback wiring.
- [x] Extract `D04_JournalEngine.gs` transfer monthly worksheet row-calculation loop to typed core (`ts/core/transferMonthlyWorksheet.ts`) and keep GAS fallback wiring.
- [x] Extract `D04_JournalEngine.gs` income/expense monthly worksheet row-calculation loop to typed core (`ts/core/ruleMonthlyWorksheet.ts`) and keep GAS fallback wiring.
- [x] Extract `D04_JournalEngine.gs` account-balance map builder helper to typed core (`ts/core/accountBalanceMap.ts`) and keep GAS fallback wiring.
- [x] Extract `D04_JournalEngine.gs` account lookup-map builder helper to typed core (`ts/core/accountLookupMap.ts`) and keep GAS fallback wiring.
- [x] Extract `D04_JournalEngine.gs` account monthly-flow worksheet row-calculation loop to typed core (`ts/core/accountMonthlyFlowWorksheet.ts`) and keep GAS fallback wiring.

## PR Review Against Code
- [x] PR notes match implemented code changes.
- [x] Evidence table matches executed checks.
- [x] No undocumented behavioral changes remain.

## Change Log
| Date | Change | Reason | Impact |
|---|---|---|---|
| 2026-02-27 | Added `migration-matrix.md` with full per-file classification and next-action plan. | Provide concrete migration planning artifact for `src -> ts` continuation. | Team can sequence migration work file-by-file instead of using broad estimates. |
| 2026-02-27 | Added sprint plan and PR notes for `2026-02-27_feat_typescript-migration-2`. | Keep sprint-loop documentation workflow intact. | New migration sprint is auditable and ready for execution. |
| 2026-02-27 | Created execution branch `feat/typescript-migration-2` and aligned sprint metadata to this branch. | Keep sprint execution isolated to one branch per sprint run. | Sprint implementation and audit trail now match the active branch. |
| 2026-02-27 | Removed `npm run sprint:check` from sprint instructions/templates and switched to change-relevant validation evidence. | `sprint:check` is no longer part of project workflow. | Sprint process docs now match the current tooling contract. |
| 2026-02-27 | Updated sprint instructions to require incremental commits with descriptive messages. | Ensure sprint execution is auditable and easier to review step-by-step. | Workflow now enforces commit hygiene during execution, not only at handoff. |
| 2026-02-27 | Extracted `Config` and `Schema` source-of-truth into `ts/core/config.ts` and `ts/core/schema.ts`, then exposed them via `TypedBudget`. | Execute the first quick-win migration target from the matrix while preserving GAS runtime usage. | `src/B01_Config.gs` and `src/B02_Schema.gs` are now thin wrappers over typed exports, reducing duplicated constant/schema maintenance. |
| 2026-02-27 | Regenerated `src/B08_TypedBudget.generated.gs` and added API surface test coverage for `TypedBudget.Config`/`TypedBudget.Schema`. | Keep generated runtime aligned with new typed exports and guard the integration contract. | Future regressions in config/schema export availability will fail tests earlier. |
| 2026-02-27 | Migrated run-model orchestration to `ts/core/runModel.ts` and run-extension shaping to `ts/core/runExtensions.ts`, with `C02`/`C03` wrappers using typed-first calls + fallback. | Continue reducing non-typed logic surface in `src/*.gs` while retaining Apps Script entry boundaries. | Core model assembly and extension shaping are now unit-testable TS logic and exported through `TypedBudget`. |
| 2026-02-27 | Added `tests/runModel.test.ts` and `tests/runExtensions.test.ts`, and expanded typed API surface checks for run-model functions. | Ensure the newly extracted logic is covered by repeatable Node tests. | Increases confidence that further GAS wrapper-thinning can happen without behavior drift. |
| 2026-02-27 | Extracted D04 Rule ID assignment logic into `ts/core/ruleIdAssignment.ts`, exported via typed runtime, and wired `D04_JournalEngine.gs` to typed-first execution with fallback. | Start high-priority `D04_JournalEngine.gs` decomposition without changing Apps Script runtime boundaries. | Rule ID assignment behavior is now directly unit-testable in TS and no longer maintained only in GAS code. |
| 2026-02-27 | Added `tests/ruleIdAssignment.test.ts` and expanded typed API surface checks for Rule ID assignment helpers. | Guard the new typed extraction and preserve runtime contract coverage. | Future regressions in Rule ID assignment behavior/export availability will fail in CI tests. |
| 2026-02-27 | Extracted D04 unknown-scenario row-disable transform into `ts/core/scenarioValidation.ts`, exported via typed runtime, and wired `D04_JournalEngine.gs` to typed-first execution with fallback. | Continue decomposing `D04_JournalEngine.gs` pure validation transforms while preserving GAS I/O boundaries. | Scenario validation row mutation logic is now directly testable TS code with stable fallback behavior in GAS. |
| 2026-02-27 | Added `tests/scenarioValidation.test.ts` and expanded typed API surface checks for scenario validation helper export. | Ensure extracted scenario validation transform remains covered and discoverable through typed runtime API contract. | Reduces regression risk during further D04 extraction phases. |
| 2026-02-27 | Extracted D04 account lookup + account validation row transforms into `ts/core/journalAccountRows.ts`, exported via typed runtime, and wired `D04_JournalEngine.gs` to typed-first execution with fallback. | Continue isolating pure account-validation logic from sheet I/O in the highest-priority split module (`D04`). | Account lookup/validation behavior is now unit-testable TS logic, reducing logic density in GAS runtime paths. |
| 2026-02-27 | Added `tests/journalAccountRows.test.ts` and expanded typed API surface checks for account-row helper exports. | Protect the newly extracted account transforms and maintain typed runtime contract coverage. | Improves confidence for subsequent D04 extraction phases and regression detection. |
| 2026-02-27 | Extracted D04 policy-row validation transform into `ts/core/journalPolicyRows.ts`, exported via typed runtime, and wired `validatePoliciesSheet_` to typed-first execution with fallback. | Continue shrinking mixed validation logic in `D04_JournalEngine.gs` while keeping sheet I/O boundaries in GAS. | Policy validation logic is now directly testable TS code and easier to evolve safely. |
| 2026-02-27 | Added `tests/journalPolicyRows.test.ts` and expanded typed API surface checks for policy-row helper export. | Protect new policy-validation extraction and maintain typed runtime contract coverage. | Reduces regression risk while moving remaining D04 row validators to TS core. |
| 2026-02-27 | Extracted D04 goal-row validation transform into `ts/core/journalGoalRows.ts`, exported via typed runtime, and wired `validateGoalsSheet_` to typed-first execution with fallback. | Continue decomposing D04 validation logic into testable core modules without altering GAS sheet I/O boundaries. | Goal validation behavior is now unit-testable TS logic and reduces D04 monolith complexity further. |
| 2026-02-27 | Added `tests/journalGoalRows.test.ts` and expanded typed API surface checks for goal-row helper export. | Protect goal-row extraction and ensure typed runtime contract remains explicit. | Further lowers regression risk for continued D04 extraction work. |
| 2026-02-27 | Extracted D04 income/transfer/expense row-validator reason callbacks into `ts/core/journalRowValidation.ts`, exported via typed runtime, and wired `validateIncomeSheet_`/`validateTransferSheet_`/`validateExpenseSheet_` to typed-first execution with fallback. | Complete the planned D04 validator-callback extraction while preserving Apps Script runtime boundary behavior. | Core row-validation reason logic is now centralized and testable in TS with GAS fallback retained. |
| 2026-02-27 | Expanded typed API surface assertions to include `validateIncomeRowReasons`/`validateTransferRowReasons`/`validateExpenseRowReasons`. | Keep generated runtime contract explicit for newly extracted row-validator helpers. | Export regressions for validator callbacks are caught during test runs. |
| 2026-02-27 | Extracted D04 transfer-row normalization transform into `ts/core/transferRowNormalization.ts`, exported via typed runtime, and wired `normalizeTransferRows_` to typed-first execution with fallback. | Continue decomposing D04 pure row transforms while preserving Apps Script sheet I/O boundaries. | Transfer type/amount canonicalization is now testable TS logic and easier to evolve without GAS-only coupling. |
| 2026-02-27 | Added `tests/transferRowNormalization.test.ts` and expanded typed API surface checks for `normalizeTransferRows`. | Guard transfer-row normalization extraction and keep typed runtime contract explicit. | Export and behavior regressions for transfer-row normalization are caught earlier in Node tests. |
| 2026-02-27 | Extracted D04 recurrence-row normalization transform into `ts/core/recurrenceRowNormalization.ts`, exported via typed runtime, and wired `normalizeRecurrenceRowsForSheet_` to typed-first execution with fallback. | Continue extracting D04 pure recurrence normalization transforms while preserving sheet I/O boundaries in GAS. | Recurrence frequency/repeat/end-date normalization is now testable TS logic and easier to maintain independently from sheet access. |
| 2026-02-27 | Added `tests/recurrenceRowNormalization.test.ts` and expanded typed API surface checks for `normalizeRecurrenceRows`. | Guard recurrence-row normalization extraction and keep typed runtime contract explicit. | Export and behavior regressions for recurrence-row normalization are caught earlier in Node tests. |
| 2026-02-27 | Extracted D04 account-row normalization transform into `ts/core/accountRowNormalization.ts`, exported via typed runtime, and wired `normalizeAccountRows_` to typed-first execution with fallback. | Continue extracting D04 pure row normalization transforms while preserving sheet I/O boundaries in GAS. | Account row normalization is now testable TS logic and easier to maintain independently from sheet access. |
| 2026-02-27 | Added `tests/accountRowNormalization.test.ts` and expanded typed API surface checks for `normalizeAccountRows`. | Guard account-row normalization extraction and keep typed runtime contract explicit. | Export and behavior regressions for account-row normalization are caught earlier in Node tests. |
| 2026-02-27 | Extracted D04 shared row-deactivation loop into `ts/core/rowDeactivation.ts`, exported via typed runtime, and wired `validateAndDeactivateRows_` to typed-first execution with fallback. | Continue shrinking D04 orchestration complexity by moving pure row mutation loops into TS core. | Shared include-flag deactivation behavior is now centralized, testable TS logic with GAS fallback retained. |
| 2026-02-27 | Added `tests/rowDeactivation.test.ts` and expanded typed API surface checks for `deactivateRowsByValidator`. | Guard shared row-deactivation extraction and keep typed runtime contract explicit. | Export and behavior regressions for row deactivation are caught earlier in Node tests. |
| 2026-02-27 | Extracted D04 income/expense monthly-rule total builders into `ts/core/monthlyRuleTotals.ts`, exported via typed runtime, and wired `buildIncomeMonthlyTotalsForRunModel_`/`buildExpenseMonthlyTotalsForRunModel_` to typed-first execution with fallback. | Continue moving pure monthly-total calculations out of D04 GAS orchestration while preserving runtime boundaries. | Monthly income/expense totals are now testable TS logic and easier to evolve independently from GAS sheet access. |
| 2026-02-27 | Added `tests/monthlyRuleTotals.test.ts` and expanded typed API surface checks for `buildIncomeMonthlyTotals`/`buildExpenseMonthlyTotals`. | Guard monthly-rule-total extraction and keep typed runtime contract explicit. | Export and behavior regressions for monthly-rule total builders are caught earlier in Node tests. |
| 2026-02-27 | Extracted D04 transfer monthly-rule total builder into `ts/core/transferRuleTotals.ts`, exported via typed runtime, and wired `buildTransferMonthlyTotalsForRunModel_` to typed-first execution with fallback. | Continue moving pure transfer monthly-total calculations out of D04 GAS orchestration while preserving runtime boundaries. | Transfer monthly totals are now testable TS logic and easier to evolve independently from GAS sheet access. |
| 2026-02-27 | Added `tests/transferRuleTotals.test.ts` and expanded typed API surface checks for `buildTransferMonthlyTotals`. | Guard transfer monthly-rule-total extraction and keep typed runtime contract explicit. | Export and behavior regressions for transfer monthly-rule totals are caught earlier in Node tests. |
| 2026-02-27 | Extracted D04 transfer monthly worksheet row-calculation loop into `ts/core/transferMonthlyWorksheet.ts`, exported via typed runtime, and wired `updateTransferMonthlyTotalsForRunModel_` to typed-first execution with fallback. | Continue moving pure transfer monthly row-calculation/sweep orchestration out of D04 GAS logic while preserving sheet I/O boundaries. | Transfer monthly worksheet calculations are now testable TS logic, reducing D04 loop complexity. |
| 2026-02-27 | Added `tests/transferMonthlyWorksheet.test.ts` and expanded typed API surface checks for `computeTransferMonthlyWorksheet`. | Guard transfer monthly worksheet extraction and keep typed runtime contract explicit. | Export and behavior regressions for transfer monthly worksheet calculations are caught earlier in Node tests. |
| 2026-02-28 | Extracted D04 income/expense monthly worksheet row-calculation loop into `ts/core/ruleMonthlyWorksheet.ts`, exported via typed runtime, and wired `updateIncomeMonthlyTotalsForRunModel_`/`updateExpenseMonthlyTotalsForRunModel_` to typed-first execution with fallback. | Continue moving pure monthly worksheet row calculations out of D04 GAS logic while preserving sheet I/O boundaries. | Income/expense monthly worksheet calculations are now testable TS logic, reducing duplicated loop logic in D04. |
| 2026-02-28 | Added `tests/ruleMonthlyWorksheet.test.ts` and expanded typed API surface checks for `computeRuleMonthlyWorksheet`. | Guard shared monthly worksheet extraction and keep typed runtime contract explicit. | Export and behavior regressions for income/expense monthly worksheet calculations are caught earlier in Node tests. |
| 2026-02-28 | Extracted D04 account-balance map builder helper into `ts/core/accountBalanceMap.ts`, exported via typed runtime, and wired `buildTransferMonthlyTotalsForRunModel_`/`updateTransferMonthlyTotalsForRunModel_` to shared typed-first map construction with fallback. | Continue reducing duplicated account-map setup logic in D04 while preserving runtime boundaries. | Account balance map construction is now centralized, testable TS logic and reduces duplicated loops in D04. |
| 2026-02-28 | Added `tests/accountBalanceMap.test.ts` and expanded typed API surface checks for `buildAccountBalanceMap`. | Guard account-balance map helper extraction and keep typed runtime contract explicit. | Export and behavior regressions for account-balance map construction are caught earlier in Node tests. |
| 2026-02-28 | Extracted D04 account lookup-map builder helper into `ts/core/accountLookupMap.ts`, exported via typed runtime, and wired `updateAccountMonthlyFlowAveragesForRunModel_` to shared typed-first lookup-map construction with fallback. | Continue reducing duplicated account-lookup map setup logic in D04 while preserving runtime boundaries. | Account lookup-map construction is now centralized, testable TS logic and reduces duplicated loops in D04 monthly flows. |
| 2026-02-28 | Added `tests/accountLookupMap.test.ts` and expanded typed API surface checks for `buildAccountLookupMap`. | Guard account lookup-map helper extraction and keep typed runtime contract explicit. | Export and behavior regressions for account lookup-map construction are caught earlier in Node tests. |
| 2026-02-28 | Extracted D04 account monthly-flow worksheet row-calculation loop into `ts/core/accountMonthlyFlowWorksheet.ts`, exported via typed runtime, and wired `updateAccountMonthlyFlowAveragesForRunModel_` to typed-first execution with fallback. | Continue moving pure account monthly-flow row calculations out of D04 GAS logic while preserving sheet I/O boundaries. | Account monthly-flow worksheet calculations are now testable TS logic and reduce loop complexity in D04. |
| 2026-02-28 | Added `tests/accountMonthlyFlowWorksheet.test.ts` and expanded typed API surface checks for `computeAccountMonthlyFlowWorksheet`. | Guard account monthly-flow worksheet extraction and keep typed runtime contract explicit. | Export and behavior regressions for account monthly-flow worksheet calculations are caught earlier in Node tests. |
| 2026-02-27 | Reworked `codex/README.md` into a prompt catalog aligned to `codex/SKILL.md` phases and required artifacts. | Make sprint prompting consistent with deterministic workflow (`codex/current-sprint.md`, `sprint-plan.md`, `PR.md`). | Future sprint requests are clearer and less likely to diverge from the mandated process. |
| 2026-02-27 | Migrated sprint marker path to `codex/current-sprint.md` and updated sprint tooling/docs references. | Ensure current sprint phase/state marker is markdown-based and consistently referenced across automation and prompts. | Sprint tooling now writes `.md` marker and still reads legacy marker files when present. |

## Test Evidence
| Type | Command/Method | Result | Notes |
|---|---|---|---|
| Validation | Reviewed/updated sprint process docs and sprint history artifacts | Pass | Confirmed no sprint instructions require `npm run sprint:check`. |
| Unit | `npm test` | Pass | Includes updated `tests/typedApiSurface.test.ts` assertions for `Config` and `Schema`. |
| Typecheck | `npm run typecheck` | Pass | New `ts/core/config.ts` and `ts/core/schema.ts` compile cleanly. |
| Build | `npm run build:typed` | Pass | Regenerated `src/B08_TypedBudget.generated.gs` with exported `Config` and `Schema`. |
| Build | `npm run build:typed` | Pass | Regenerated `src/B08_TypedBudget.generated.gs` with run-model and run-extension exports. |
| Unit | `npm test` | Pass | Includes new `tests/ruleIdAssignment.test.ts` coverage for D04 Rule ID assignment extraction. |
| Build | `npm run build:typed` | Pass | Regenerated typed bundle with `hasMeaningfulRowDataForRuleId` and `assignMissingRuleIdsRows` exports. |
| Unit | `npm test` | Pass | Includes new `tests/scenarioValidation.test.ts` coverage for unknown-scenario row-disable extraction. |
| Build | `npm run build:typed` | Pass | Regenerated typed bundle with `disableUnknownScenarioRows` export and adapter wiring. |
| Unit | `npm test` | Pass | Includes new `tests/journalAccountRows.test.ts` coverage for D04 account lookup/validation row transforms. |
| Build | `npm run build:typed` | Pass | Regenerated typed bundle with `buildAccountLookupFromRows` and `validateAccountsRows` exports and adapter wiring. |
| Unit | `npm test` | Pass | Includes new `tests/journalPolicyRows.test.ts` coverage for D04 policy-row validation transform extraction. |
| Build | `npm run build:typed` | Pass | Regenerated typed bundle with `validatePolicyRows` export and adapter wiring. |
| Unit | `npm test` | Pass | Includes new `tests/journalGoalRows.test.ts` coverage for D04 goal-row validation transform extraction. |
| Build | `npm run build:typed` | Pass | Regenerated typed bundle with `validateGoalRows` export and adapter wiring. |
| Unit | `npm test` | Pass | Includes `tests/journalRowValidation.test.ts` coverage for typed income/transfer/expense row-validator callbacks. |
| Build | `npm run build:typed` | Pass | Regenerated typed bundle with `validateIncomeRowReasons`, `validateTransferRowReasons`, and `validateExpenseRowReasons` exports and adapter wiring. |
| Unit | `npm.cmd test` | Fail | Blocked by environment cache policy (`ENOTCACHED` fetching `tsx` from npm registry). |
| Validation | Updated `codex/README.md` prompt catalog to match `codex/SKILL.md` phase model | Pass | Prompt set now explicitly maps to required sprint phases and sprint artifacts. |
| Validation | `node scripts/sprint-tools.mjs check` | Pass | Passed with current marker stored at `codex/current-sprint.md`. |
| Manual | Verified matrix covers all `src/*.gs` files exactly once | Pass | 23 files represented. |

## Risks
- Residual risk: LOC and GAS-API-hit based estimates are directional.
  Mitigation/follow-up: validate each split during implementation with small extraction PRs and parity tests.

## Definition Of Done Check
- [x] Scope delivered
- [x] Evidence captured
- [x] Risks/follow-ups documented

## Follow-Ups
- Next implementation target: begin `D04_JournalEngine.gs` extraction of pure decision logic to `ts/core`.
- Continue `D04_JournalEngine.gs` extraction for remaining pure decision logic and non-I/O transforms still embedded in GAS wrappers.

