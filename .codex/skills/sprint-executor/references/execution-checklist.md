# Execution Checklist

Use this only when implementing a sprint.

## Preflight

- Confirm active branch is `sprint/<sprint-id>`.
- Read `.codex/sprints/<sprint-id>/sprint-plan.md`.
- Confirm target files and tests before editing.

## During Implementation

- Complete one task at a time.
- Update `.codex/sprints/<sprint-id>/PR.md` after each completed task.
- Keep test evidence current.

## Commit Safety

- `git status --short`
- `git add <explicit-file-list>`
- `git diff --cached --name-only`
- Verify only intended files are staged

## Completion

- Run relevant checks.
- Finalize `PR.md`.
- Ensure unrelated changes remain uncommitted.

