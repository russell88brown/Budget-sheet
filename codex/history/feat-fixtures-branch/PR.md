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
- [ ] Fixture implementation and validation (in progress).

## Change Log
| Date | Change | Reason | Impact |
|---|---|---|---|
| 2026-02-27 | Added sprint plan with explicit tasks, acceptance criteria, and risks for the fixture sprint. | Align implementation to the sprint-loop skill and lock scope before coding. | Clear execution checklist and documentation baseline. |
| 2026-02-27 | Expanded `eventSort.test.ts` with a full golden order assertion and exact priority ranking. | Lock deterministic backbone ordering during migration. | Regressions in event ordering now fail with precise fixture diffs. |
| 2026-02-27 | Expanded `compiledEvent.test.ts` with same-day tie-break fixture (`sourceRuleId` -> `name` -> `id`) and default id assertion (`evt_<index>`). | Prevent non-deterministic compiled event ordering drift. | Stable sort behavior is now explicitly pinned by exact expected id order. |
| 2026-02-27 | Expanded `applyCalculations.test.ts` with transfer resolution matrix cases (everything-except skip path, repay-all payoff amount, repay cap/skip behavior, `creditPaidOff` flags) and outgoing estimate behavior. | Pin down money movement edge cases most likely to drift during migration. | Transfer behavior is now protected by exact amount/skip/flag assertions. |
| 2026-02-27 | Expanded `readerNormalization.test.ts` for legacy `"repayment"` alias with amount > 0 mapping to repayment-by-amount. | Complete compatibility coverage for shorthand transfer aliases. | Prevents normalization regressions between `REPAYMENT_ALL` and `REPAYMENT_AMOUNT`. |
| 2026-02-27 | Expanded `recurrence.test.ts` with Jan-31 monthly clamp fixture, weekly/monthly pre-window alignment fixtures, and timezone-safe local date formatting for deterministic assertions. | Lock down recurrence/date boundary behavior during migration. | Month-end and alignment edge cases are now explicit fixture contracts. |

## Test Evidence
| Type | Command/Method | Result | Notes |
|---|---|---|---|
| Validation | `npm run sprint:check` | Pending | Run after fixture implementation commits are complete. |
| Unit | `npm exec tsx -- tests/eventSort.test.ts` + `npm exec tsx -- tests/compiledEvent.test.ts` | Fail | Windows ESM path issue when invoking single files directly from this shell; using `npm test` runner for authoritative validation. |
| Unit | `npm test` | Pass | Passed after slices 2 and 3 fixture additions. |
| Typecheck | `npm run typecheck` | Pending | To be captured with final validation pass. |
| Manual | Sprint doc review | Pass | `sprint-plan.md` now reflects requested 10-fixture scope. |

## Risks
- Residual risk: overlap with existing tests may duplicate assertions.
  Mitigation/follow-up: keep additions edge-focused and consolidate when touching each file.

## Definition Of Done Check
- [ ] Scope delivered
- [ ] Evidence captured
- [ ] Risks/follow-ups documented

## Follow-Ups
- Confirm whether sprint docs should also be mirrored to any `.codex/...` path used by local IDE views.
