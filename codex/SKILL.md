---
name: sprint-loop
description: Use for the full sprint loop in one place: plan, execute feature work, and keep PR notes updated in codex/history/<sprint-id>/.
---

# Sprint Loop

Single skill for end-to-end sprint delivery.

This skill is the default workflow for this repo.

## Inputs

- Sprint ID
- Branch (user-driven naming)
- Sprint docs in `codex/history/<sprint-id>/`

## Files You Must Maintain

- `codex/history/<sprint-id>/sprint-plan.md`
- `codex/history/<sprint-id>/PR.md`

## Workflow

1. Plan
   - Read `sprint-plan.md`.
   - Confirm objective, scope in/out, tasks, acceptance criteria.
   - If needed, tighten scope before coding.
2. Execute
   - Implement one task at a time from `Task Checklist`.
   - Keep work aligned to acceptance criteria.
3. Document Continuously
   - After each completed task, update `PR.md`:
     - change made,
     - reason,
     - validation evidence,
     - residual risk or follow-up.
4. Validate
   - Run relevant checks for your code changes.
   - Always run `npm run sprint:check` before handoff.
5. Close
   - Ensure open items are explicit in `Follow-Ups`.

## Branch Guidance

- Keep Git flow user-driven.
- Use any branch naming convention, but keep one branch per sprint execution.
- Keep commits scoped to sprint work.

## Quality Bar

- Deliver the planned feature scope first.
- Keep documentation current during execution, not only at the end.
- Keep follow-ups explicit when something is out of scope.
- Make validation evidence easy to review in `PR.md`.

## Definition Of Done

- Planned scope completed or explicitly de-scoped with rationale.
- `PR.md` includes clear change log and test/validation evidence.
- `npm run sprint:check` passes.
