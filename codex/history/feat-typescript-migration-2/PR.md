# PR Notes: feat-typescript-migration-2

## Summary
Created a file-by-file TypeScript migration plan for all `src/*.gs` modules, including quantitative migration estimates and explicit recommendations for what should move to `ts/core`, what should remain Apps Script runtime, and what should be split.

## Sprint Plan Reference
- Sprint folder: `codex/history/feat-typescript-migration-2/`
- Plan file: `codex/history/feat-typescript-migration-2/sprint-plan.md`

## Completed Scope
- [x] Inventory and classify all `src/*.gs` files.
- [x] Capture migrated vs remaining estimates.
- [x] Produce per-file migration recommendations and next actions.
- [x] Link cleanup handoff from previous sprint.

## Change Log
| Date | Change | Reason | Impact |
|---|---|---|---|
| 2026-02-27 | Added `migration-matrix.md` with full per-file classification and next-action plan. | Provide concrete migration planning artifact for `src -> ts` continuation. | Team can sequence migration work file-by-file instead of using broad estimates. |
| 2026-02-27 | Added sprint plan and PR notes for `feat-typescript-migration-2`. | Keep sprint-loop documentation workflow intact. | New migration sprint is auditable and ready for execution. |
| 2026-02-27 | Created execution branch `feat/typescript-migration-2` and aligned sprint metadata to this branch. | Keep sprint execution isolated to one branch per sprint run. | Sprint implementation and audit trail now match the active branch. |
| 2026-02-27 | Removed `npm run sprint:check` from sprint instructions/templates and switched to change-relevant validation evidence. | `sprint:check` is no longer part of project workflow. | Sprint process docs now match the current tooling contract. |
| 2026-02-27 | Updated sprint instructions to require incremental commits with descriptive messages. | Ensure sprint execution is auditable and easier to review step-by-step. | Workflow now enforces commit hygiene during execution, not only at handoff. |

## Test Evidence
| Type | Command/Method | Result | Notes |
|---|---|---|---|
| Validation | Reviewed/updated sprint process docs and sprint history artifacts | Pass | Confirmed no sprint instructions require `npm run sprint:check`. |
| Unit | `N/A (docs-only)` | N/A | No test-affecting code changed. |
| Typecheck | `N/A (docs-only)` | N/A | No TypeScript code changed. |
| Manual | Verified matrix covers all `src/*.gs` files exactly once | Pass | 23 files represented. |

## Risks
- Residual risk: LOC and GAS-API-hit based estimates are directional.
  Mitigation/follow-up: validate each split during implementation with small extraction PRs and parity tests.

## Definition Of Done Check
- [x] Scope delivered
- [x] Evidence captured
- [x] Risks/follow-ups documented

## Follow-Ups
- Start implementation sprint with `B01_Config.gs` + `B02_Schema.gs` extraction to TS shared modules.
