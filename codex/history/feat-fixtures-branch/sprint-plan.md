# Sprint Plan: feat-fixtures-branch

## Metadata
- Sprint ID: `feat-fixtures-branch`
- Start date (YYYY-MM-DD): 2026-02-27
- End date (YYYY-MM-DD): 2026-02-27
- Owner: Codex + User
- Branch: `codex/feat-fixtures-branch`

## Objective
Add high-value deterministic fixture tests that lock down typed-core behavior during the TypeScript migration, with explicit coverage for sorting, transfer resolution, recurrence boundaries, policy selection, scenario scope, and summary stats.

## Scope In
- Implement and/or strengthen fixtures for all 10 requested contracts:
  1. Canonical event sort order + event priority ranking
  2. Same-day compiled event tie-break ordering + default id assignment
  3. Transfer resolution matrix (repayment caps, skip paths, everything-except behavior, creditPaidOff)
  4. Legacy transfer alias normalization (`repayment`, `transfer`)
  5. Month-end recurrence clamping (Jan 31 -> Feb boundary)
  6. Window alignment from pre-window anchor (weekly/monthly) + past ONCE exclusion
  7. Policy active range day-boundary behavior
  8. Applicable auto-deficit policy filtering + deterministic ordering
  9. Scenario set normalization/filtering semantics (Base default/inclusion)
  10. Summary stats tolerance/stat correctness (including mixed numeric/string input)
- Keep tests in existing no-framework style (`tsx` + `node:assert/strict`).
- Update sprint docs continuously while completing tasks.

## Scope Out
- Refactoring typed-core implementation behavior beyond what is needed for fixture correctness.
- Introducing a test framework/mocking library.
- Runtime/sheet integration tests outside current unit test harness.

## Task Checklist
- [x] Confirm baseline and map each of the 10 requested fixtures to existing test files or new fixture-focused test files.
- [x] Add fixture assertions for event sorting contracts (order list + priority ranking + tie-break deterministic ordering).
- [x] Add fixture assertions for transfer resolution contracts (estimate + resolve matrix, skip/cap/creditPaidOff).
- [x] Add fixture assertions for normalization contracts (`normalizeTransferType` alias compatibility).
- [x] Add fixture assertions for recurrence boundary contracts (month-end clamp + alignToWindow + ONCE in past).
- [x] Add fixture assertions for policy contracts (active date boundaries + auto-deficit selection sort/filter).
- [x] Add fixture assertions for scenario scope contracts (Base inclusion + column inclusion rules).
- [x] Add fixture assertions for summary stats contracts (tolerance, min/max/start/end/netChange, mixed-type counting).
- [x] Run validation (`npm test`, `npm run sprint:check`) and resolve failures.
- [x] Update `PR.md` with per-task change log, evidence, and residual follow-ups.

## Acceptance Criteria
- All 10 requested fixture contracts are represented by explicit assertions in tests.
- Fixtures assert exact deterministic outputs (ordered arrays, exact sorted ids, exact date sequences, exact amounts/flags).
- Legacy normalization behaviors for `repayment` and `transfer` are explicitly covered.
- `npm test` passes.
- `npm run sprint:check` passes.
- `codex/history/feat-fixtures-branch/PR.md` documents changes and validation evidence.

## Constraints
- Use existing test runner (`node scripts/run-tests.mjs`) and existing TypeScript test files.
- Keep fixture values deterministic and timezone-safe by normalizing dates in test context.

## Definition Of Done
- [x] Planned scope implemented
- [x] Validation/test evidence recorded
- [x] `PR.md` updated with evidence

## Risks And Mitigations
- Risk: Existing tests already overlap some fixtures, causing redundant/fragile assertions.
  Mitigation: Consolidate by adding only missing edge-case assertions and reuse existing test contexts.
- Risk: Date fixtures can be flaky due to local timezone handling.
  Mitigation: Use normalized dates and compare exact YYYY-MM-DD or normalized timestamps consistently.
- Risk: Branch/path naming confusion (`.codex` vs `codex`, typo `featu-fixtures`).
  Mitigation: Standardize docs and updates under `codex/history/feat-fixtures-branch/`.
