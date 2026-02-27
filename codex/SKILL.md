---
name: sprint-loop
description: Deterministic sprint workflow. From prompt + this file, create branch/docs, implement in chunks, validate, and maintain PR notes in codex/branch/<sprint-id>/.
---

# Sprint Loop Skill

## 1) Purpose

This file is the authoritative workflow for sprint execution in this repository.

The agent MUST follow this file when doing sprint work.

## 2) Required Conventions

1. Sprint ID format MUST be: `YYYY-MM-DD_feat_<kebab-name>`
2. Sprint docs MUST live in: `codex/branch/<sprint-id>/`
3. Active sprint marker MUST be: `codex/current-sprint`
4. Active phase marker MUST be: `codex/current-phase`
5. One sprint MUST use one git branch.

`codex/current-phase` format MUST be:
`<phase>|<status>`

Allowed `phase` values:
- `create_plan_from_prompt`
- `review_and_finalize_plan`
- `execute_task_chunk`
- `review_pr_against_code`
- `determine_remaining_actions`
- `final_checks_and_housekeeping`

Allowed `status` values:
- `in_progress`
- `completed`

## 3) Inputs

The agent receives:
1. User prompt (feature/goal request)
2. Repository state
3. This `SKILL.md`

The agent MUST derive:
1. `slug`: concise `kebab-name` from prompt
2. `date`: current date as `YYYY-MM-DD`
3. `sprint-id`: `<date>_feat_<slug>`
4. `branch-name`: default `feat/<slug>` (unless user specifies a different one)

## 4) Setup Procedure (MUST)

1. Check git status.
2. Create/switch branch:
   - If `branch-name` exists: checkout.
   - Else: create and checkout.
3. Ensure sprint folder exists:
   - `codex/branch/<sprint-id>/`
4. Ensure both files exist:
   - `sprint-plan.md`
   - `PR.md`
5. If missing, create them from templates in Section 10.
6. Set `codex/current-sprint` to `<sprint-id>`.
7. Set `codex/current-phase` to `create_plan_from_prompt|in_progress`.
8. Read `sprint-plan.md` and `PR.md` before coding.

## 5) Execution Rules (MUST)

1. Work one checklist item at a time.
2. Keep docs in sync while coding:
   - update `PR.md` after each completed chunk.
   - keep `sprint-plan.md` checklist accurate.
3. Prefer TypeScript-first extraction for pure logic:
   - business logic in `ts/core/*`
   - runtime boundaries in `src/*.gs`
4. Keep changes scoped; avoid unrelated edits.
5. Commit continuously with descriptive messages.

## 5.1) Phase Guide (MUST)

Use the phase that matches the current task being performed:

1. Create Plan From Prompt
   - Convert prompt into concrete scope, checklist tasks, and acceptance criteria.
2. Review And Finalize Plan
   - Validate scope boundaries, risks, and test strategy before implementation.
3. Execute Task Chunk
   - Implement one meaningful chunk.
4. Review PR Notes Against Code
   - Ensure `PR.md` reflects actual code changes and evidence.
5. Determine Remaining Actions
   - Update remaining checklist items and explicit next actions.
6. Final Checks And Housekeeping (Pre-PR)
   - Run relevant validation, ensure docs are current, and clean up residual process debt.

The agent MUST update `codex/current-phase` when sprint docs are updated.

## 6) Validation Rules (MUST)

Run only relevant checks for changed scope, and record exact results in `PR.md`:
1. `npm run typecheck` when TS is changed
2. `npm test` when behavior/tests are affected
3. `npm run build:typed` when typed runtime/export surface changes
4. Any manual verification needed for runtime-only behavior

## 7) Commit Rules (MUST)

1. Commit per meaningful task chunk.
2. Commit message MUST describe the actual change.
3. Do not wait until sprint end for one large commit.
4. Do not mix unrelated work in one commit.

## 8) Definition Of Done (MUST)

All must be true:
1. Planned scope completed or explicitly de-scoped with rationale.
2. `PR.md` contains clear change log and validation evidence.
3. Follow-ups/risks are explicit.
4. Commits are incremental and auditable.

## 9) Failure/Blocker Handling (MUST)

If blocked:
1. Record blocker in `PR.md` (what, impact, attempted mitigation).
2. Continue with next unblocked scoped task when possible.
3. If no safe next task exists, ask the user a specific decision question.

## 10) Canonical Templates

Use these templates when creating new sprint files.

### `sprint-plan.md`

```md
# Sprint Plan: <sprint-id>

## Metadata
- Sprint ID: `<sprint-id>`
- Start date (YYYY-MM-DD): YYYY-MM-DD
- End date (YYYY-MM-DD): YYYY-MM-DD
- Owner: Codex + User
- Branch: `feat/<slug>`

## Objective
Describe the primary sprint outcome in one sentence.

## Desired End State
- TypeScript owns most business logic and tests.
- Apps Script files remain runtime wrappers/integration boundaries.

## Scope In
- In-scope item 1
- In-scope item 2

## Scope Out
- Explicitly excluded item 1
- Explicitly excluded item 2

## Task Checklist
- [ ] Task 1 (maps to acceptance criteria)
- [ ] Task 2 (maps to acceptance criteria)

## Plan Review And Finalization
- [ ] Scope in/out is explicit and realistic.
- [ ] Acceptance criteria are testable.
- [ ] Risks/mitigations are documented.
- [ ] Validation approach is defined.

## Acceptance Criteria
- Criterion 1 (testable/verifiable)
- Criterion 2 (testable/verifiable)

## Constraints
- Constraint 1
- Constraint 2

## Definition Of Done
- [ ] Planned scope implemented
- [ ] Validation/test evidence recorded
- [ ] `PR.md` updated with evidence

## Risks And Mitigations
- Risk: problem statement.
  Mitigation: concrete prevention/reduction action.
```

### `PR.md`

```md
# PR Notes: <sprint-id>

## Summary
Summarize what changed and why.

## Sprint Plan Reference
- Sprint folder: `codex/branch/<sprint-id>/`
- Plan file: `codex/branch/<sprint-id>/sprint-plan.md`

## Completed Scope
- [ ] Completed item 1
- [ ] Completed item 2

## PR Review Against Code
- [ ] PR notes match implemented code changes.
- [ ] Evidence table matches executed checks.
- [ ] No undocumented behavioral changes remain.

## Change Log
| Date | Change | Reason | Impact |
|---|---|---|---|
| YYYY-MM-DD | Example change | Why it was done | User/system impact |

## Test Evidence
| Type | Command/Method | Result | Notes |
|---|---|---|---|
| Validation | Process/docs verification (if applicable) | Pass/Fail/N/A | Record what was validated |
| Unit | `npm test` (if code changed) | Pass/Fail/N/A | Include key evidence |
| Typecheck | `npm run typecheck` (if TS touched) | Pass/Fail/N/A | Include key evidence |
| Build | `npm run build:typed` (if typed runtime touched) | Pass/Fail/N/A | Include key evidence |
| Manual | Manual verification method | Pass/Fail/N/A | Include short result summary |

## Risks
- Residual risk and mitigation/follow-up.

## Definition Of Done Check
- [ ] Scope delivered
- [ ] Evidence captured
- [ ] Risks/follow-ups documented

## Follow-Ups
- Out-of-scope improvement 1
- Out-of-scope improvement 2

## Remaining Actions
- Item 1 still required before PR.
- Item 2 still required before PR.

## Final Checks And Housekeeping (Pre-PR)
- [ ] Relevant tests/checks executed and recorded.
- [ ] Sprint checklist and PR notes are current.
- [ ] Outstanding risks/follow-ups are explicit.
- [ ] Branch is ready for PR handoff.
```
