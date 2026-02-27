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

## Test Evidence
| Type | Command/Method | Result | Notes |
|---|---|---|---|
| Validation | Reviewed/updated sprint process docs and sprint history artifacts | Pass | Confirmed no sprint instructions require `npm run sprint:check`. |
| Unit | `npm test` | Pass | Includes updated `tests/typedApiSurface.test.ts` assertions for `Config` and `Schema`. |
| Typecheck | `npm run typecheck` | Pass | New `ts/core/config.ts` and `ts/core/schema.ts` compile cleanly. |
| Build | `npm run build:typed` | Pass | Regenerated `src/B08_TypedBudget.generated.gs` with exported `Config` and `Schema`. |
| Build | `npm run build:typed` | Pass | Regenerated `src/B08_TypedBudget.generated.gs` with run-model and run-extension exports. |
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

