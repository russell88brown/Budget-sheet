---
name: sprint-planner
description: Use when the user asks to plan a sprint, turn backlog/goals into a sprint plan, or create/update .codex/sprints/<sprint-id>/sprint-plan.md with scope, tasks, acceptance criteria, and risks.
---

# Sprint Planner

Create or update `.codex/sprints/<sprint-id>/sprint-plan.md` using the repo template.

If needed, load [references/plan-checklist.md](references/plan-checklist.md) for a strict section checklist.

## Workflow

1. Confirm sprint ID and objective.
2. Review prior sprint context before drafting:
   - latest `.codex/sprints/<prior-id>/sprint-plan.md`,
   - latest `.codex/sprints/<prior-id>/PR.md`,
   - latest `.codex/sprints/<prior-id>/retro.md`.
3. Extract carry-over items:
   - incomplete tasks,
   - unresolved risks,
   - failed/weak test evidence,
   - retro action items still open.
4. Build a clear plan with:
   - scope in/out,
   - task checklist,
   - testable acceptance criteria,
   - constraints,
   - definition of done,
   - risks and mitigations,
   - explicit prior-sprint carry-over references.
5. Keep scope small enough to ship in one sprint.
6. Mark ambiguous items explicitly in the plan as open questions.

## Quality Bar

- Every acceptance criterion must be verifiable.
- Every planned task should map to at least one acceptance criterion.
- Do not include implementation details unless they reduce delivery risk.
- Every carry-over item must reference the prior sprint source (`PR.md` or `retro.md`).
