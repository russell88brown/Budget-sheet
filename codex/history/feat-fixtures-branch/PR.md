# PR Notes: feat-fixtures-branch

## Summary
Build deterministic fixture coverage for high-risk typed-core contracts during migration (sorting, transfers, recurrence, policy selection, scenario scope, and summary stats), with incremental commits and evidence.

## Sprint Plan Reference
- Sprint folder: `codex/history/feat-fixtures-branch/`
- Plan file: `codex/history/feat-fixtures-branch/sprint-plan.md`

## Completed Scope
- [x] Sprint plan created for the 10 requested fixture contracts.
- [x] Fixture slice 1: canonical event sort order and compiled-event tie-break ordering contracts.
- [ ] Fixture implementation and validation (in progress).

## Change Log
| Date | Change | Reason | Impact |
|---|---|---|---|
| 2026-02-27 | Added sprint plan with explicit tasks, acceptance criteria, and risks for the fixture sprint. | Align implementation to the sprint-loop skill and lock scope before coding. | Clear execution checklist and documentation baseline. |
| 2026-02-27 | Expanded `eventSort.test.ts` with a full golden order assertion and exact priority ranking. | Lock deterministic backbone ordering during migration. | Regressions in event ordering now fail with precise fixture diffs. |
| 2026-02-27 | Expanded `compiledEvent.test.ts` with same-day tie-break fixture (`sourceRuleId` -> `name` -> `id`) and default id assertion (`evt_<index>`). | Prevent non-deterministic compiled event ordering drift. | Stable sort behavior is now explicitly pinned by exact expected id order. |

## Test Evidence
| Type | Command/Method | Result | Notes |
|---|---|---|---|
| Validation | `npm run sprint:check` | Pending | Run after fixture implementation commits are complete. |
| Unit | `npm exec tsx -- tests/eventSort.test.ts` + `npm exec tsx -- tests/compiledEvent.test.ts` | Fail | Windows ESM path issue when invoking single files directly from this shell; using `npm test` runner for authoritative validation. |
| Unit | `npm test` | Pending | Final result will be recorded after all slices are merged. |
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
