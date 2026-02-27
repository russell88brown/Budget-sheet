---
name: sprint-executor
description: Use when the user asks to execute a sprint, implement tasks from .codex/sprints/<sprint-id>/sprint-plan.md, update .codex/sprints/<sprint-id>/PR.md continuously, and prepare deliverable PR output.
---

# Sprint Executor

Treat `.codex/sprints/<sprint-id>/sprint-plan.md` as the source of truth for execution.

If needed, load [references/execution-checklist.md](references/execution-checklist.md).
For deterministic branch and staged-file checks, run:
`node .codex/skills/sprint-executor/scripts/guard-commit.mjs <sprint-id> <allowed-prefix...>`.

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

## Branch And Commit Discipline

Before any edits:

1. Verify current branch is `sprint/<sprint-id>`.
2. If branch is wrong, stop and switch before continuing.

Before each commit:

1. Check `git status --short`.
2. Stage only intended files (explicit `git add <file...>`, never broad add).
3. Re-check staged files (`git diff --cached --name-only`) and confirm they match sprint scope.
4. Commit only scoped files; leave unrelated changes untouched.

After commit:

1. Confirm unrelated modified/untracked files are still uncommitted.
2. Record commit hash in `PR.md` change log when useful for traceability.

## Quality Bar

- Do not implement out-of-scope work unless the plan is updated.
- Include negative findings (what was attempted and rejected) when relevant.
- Keep `PR.md` current; never batch-update at the end only.
- Never commit unrelated files from parallel workstreams.
