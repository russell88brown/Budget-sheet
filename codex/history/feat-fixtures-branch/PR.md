# PR Notes: feat-fixtures-branch

## Summary
Build deterministic fixture coverage for high-risk typed-core contracts during migration (sorting, transfers, recurrence, policy selection, scenario scope, and summary stats), with incremental commits and evidence.

## Sprint Plan Reference
- Sprint folder: `codex/history/feat-fixtures-branch/`
- Plan file: `codex/history/feat-fixtures-branch/sprint-plan.md`

## Completed Scope
- [x] Sprint plan created for the 10 requested fixture contracts.
- [x] Fixture slice 1: canonical event sort order and compiled-event tie-break ordering contracts.
- [x] Fixture slice 2: transfer resolution matrix expansion and legacy transfer alias normalization.
- [x] Fixture slice 3: recurrence month-end and window-alignment boundary fixtures.
- [x] Fixture slice 4: policy boundaries, scenario scope, and summary stats fixtures.
- [x] Full validation completed (`npm run sprint:check`, `npm run typecheck`, `npm test`).
- [x] Reduced fixture-harness duplication in `src/Z01_FixtureTests.gs` with shared helpers and generated fixture registration.
- [x] Added typed API surface smoke fixture to catch `ts/apps-script/entry.ts` export drift before generated bundle rollout.

## Change Log
| Date | Change | Reason | Impact |
|---|---|---|---|
| 2026-02-27 | Added sprint plan with explicit tasks, acceptance criteria, and risks for the fixture sprint. | Align implementation to the sprint-loop skill and lock scope before coding. | Clear execution checklist and documentation baseline. |
| 2026-02-27 | Expanded `eventSort.test.ts` with a full golden order assertion and exact priority ranking. | Lock deterministic backbone ordering during migration. | Regressions in event ordering now fail with precise fixture diffs. |
| 2026-02-27 | Expanded `compiledEvent.test.ts` with same-day tie-break fixture (`sourceRuleId` -> `name` -> `id`) and default id assertion (`evt_<index>`). | Prevent non-deterministic compiled event ordering drift. | Stable sort behavior is now explicitly pinned by exact expected id order. |
| 2026-02-27 | Expanded `applyCalculations.test.ts` with transfer resolution matrix cases (everything-except skip path, repay-all payoff amount, repay cap/skip behavior, `creditPaidOff` flags) and outgoing estimate behavior. | Pin down money movement edge cases most likely to drift during migration. | Transfer behavior is now protected by exact amount/skip/flag assertions. |
| 2026-02-27 | Expanded `readerNormalization.test.ts` for legacy `"repayment"` alias with amount > 0 mapping to repayment-by-amount. | Complete compatibility coverage for shorthand transfer aliases. | Prevents normalization regressions between `REPAYMENT_ALL` and `REPAYMENT_AMOUNT`. |
| 2026-02-27 | Expanded `recurrence.test.ts` with Jan-31 monthly clamp fixture, weekly/monthly pre-window alignment fixtures, and timezone-safe local date formatting for deterministic assertions. | Lock down recurrence/date boundary behavior during migration. | Month-end and alignment edge cases are now explicit fixture contracts. |
| 2026-02-27 | Expanded `policyRules.test.ts` with explicit active range boundary checks and tighter auto-deficit selection fixtures (type/account/date filtering + deterministic priority/name ordering). | Protect policy application behavior from off-by-one and ordering regressions. | Policy filtering and ordering contracts are now pinned with exact expected rule ids. |
| 2026-02-27 | Expanded `tagScope.test.ts` for `null` scenario normalization to Base and scenario-column inclusion behavior with normalized duplicate tags. | Lock scenario scoping semantics that affect filtered outputs. | Base-default and column-visibility behavior is explicitly covered. |
| 2026-02-27 | Expanded `summaryStats.test.ts` with requested tolerance examples and mixed numeric/string threshold counting behavior. | Guard reconciliation/stat logic against input-shape drift. | Tolerance and mixed-value counting behavior is now documented by fixtures. |
| 2026-02-27 | Set `codex/current-sprint` to `feat-fixtures-branch` and completed final validation (`sprint:check`, `typecheck`, `test`). | Satisfy sprint-loop quality gate and record completion evidence. | Sprint documentation status is now checkable and complete for handoff. |
| 2026-02-27 | Refactored `src/Z01_FixtureTests.gs` to generate fixture specs from ids and reuse shared helpers (`fixtureModel_`, `fixtureAccount_`, `compileAndApplyFixtureModel_`, `applyFixtureEvents_`, sequence assertion helper). | Reduce fixture LOC/duplication while preserving deterministic behavior during migration. | Fixture harness is shorter and easier to extend without changing fixture semantics. |
| 2026-02-27 | Added `tests/typedApiSurface.test.ts` to assert required exported functions on `TypedBudget` from `ts/apps-script/entry.ts`. | Quick migration guardrail for `src` -> generated TypeScript API surface parity. | Missing/miswired core exports now fail fast in Node test runs. |

## Test Evidence
| Type | Command/Method | Result | Notes |
|---|---|---|---|
| Validation | `npm run sprint:check` | Pass | Passed after setting `codex/current-sprint` to `feat-fixtures-branch`. |
| Unit | `npm exec tsx -- tests/eventSort.test.ts` + `npm exec tsx -- tests/compiledEvent.test.ts` | Fail | Windows ESM path issue when invoking single files directly from this shell; using `npm test` runner for authoritative validation. |
| Unit | `npm test` | Pass | Passed after final fixture and doc completion. |
| Typecheck | `npm run typecheck` | Pass | No TS errors after fixture updates. |
| Unit | `npm test` | Pass | Passed after `Z01_FixtureTests.gs` refactor and helper extraction. |
| Typecheck | `npm run typecheck` | Pass | Passed after fixture harness refactor. |
| Unit | `npm test` | Pass | Includes `typedApiSurface.test.ts` export surface smoke coverage. |
| Manual | Sprint doc review | Pass | `sprint-plan.md` now reflects requested 10-fixture scope. |

## Risks
- Residual risk: overlap with existing tests may duplicate assertions.
  Mitigation/follow-up: keep additions edge-focused and consolidate when touching each file.

## Definition Of Done Check
- [x] Scope delivered
- [x] Evidence captured
- [x] Risks/follow-ups documented

## Follow-Ups
- Decision recorded: keep canonical sprint docs under `codex/history/...` only (no `.codex` mirroring).
- Handoff created for migration planning in `codex/history/feat-typescript-migration-2/`.
