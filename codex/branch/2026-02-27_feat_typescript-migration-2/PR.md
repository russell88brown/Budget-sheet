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
| 2026-02-27 | Reworked `codex/README.md` into a prompt catalog aligned to `codex/SKILL.md` phases and required artifacts. | Make sprint prompting consistent with deterministic workflow (`codex/current-sprint`, `sprint-plan.md`, `PR.md`). | Future sprint requests are clearer and less likely to diverge from the mandated process. |

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
| Validation | Updated `codex/README.md` prompt catalog to match `codex/SKILL.md` phase model | Pass | Prompt set now explicitly maps to required sprint phases and sprint artifacts. |
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
- Continue `D04_JournalEngine.gs` extraction by moving pure scenario/account validation row transforms next.
- Continue `D04_JournalEngine.gs` extraction with account lookup/validation transforms that do not require direct sheet I/O.
- Continue `D04_JournalEngine.gs` extraction by moving policy/goal row validation transforms that can be isolated from sheet write operations.

