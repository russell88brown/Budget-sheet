---
name: sprint-planner
description: Use when the user asks to plan a sprint, turn backlog/goals into a sprint plan, or create/update .codex/sprints/<sprint-id>/sprint-plan.md with scope, tasks, acceptance criteria, and risks.
---

# Sprint Planner

Create or update `.codex/sprints/<sprint-id>/sprint-plan.md` using the repo template.

If needed, load [references/plan-checklist.md](references/plan-checklist.md) for a strict section checklist.

## Workflow

1. Confirm sprint ID and objective.
2. Build a clear plan with:
   - scope in/out,
   - task checklist,
   - testable acceptance criteria,
   - constraints,
   - definition of done,
   - risks and mitigations.
3. Keep scope small enough to ship in one sprint.
4. Mark ambiguous items explicitly in the plan as open questions.

## Quality Bar

- Every acceptance criterion must be verifiable.
- Every planned task should map to at least one acceptance criterion.
- Do not include implementation details unless they reduce delivery risk.
