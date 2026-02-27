---
name: sprint-executor
description: Use when implementing a sprint from .codex/sprints/<sprint-id>/sprint-plan.md and maintaining .codex/sprints/<sprint-id>/PR.md as work progresses.
---

# Sprint Executor

Treat `.codex/sprints/<sprint-id>/sprint-plan.md` as the source of truth for execution.

## Workflow

1. Read sprint plan and restate tasks in execution order.
2. Implement tasks one by one on `sprint/<sprint-id>` branch.
3. After each completed task, update `.codex/sprints/<sprint-id>/PR.md`:
   - change made,
   - reason,
   - test evidence,
   - risk or follow-up.
4. Run relevant checks before completion.
5. Finalize `PR.md` with complete summary and validation results.

## Quality Bar

- Do not implement out-of-scope work unless the plan is updated.
- Include negative findings (what was attempted and rejected) when relevant.
- Keep `PR.md` current; never batch-update at the end only.

