---
name: sprint-loop
description: Authoritative workflow for sprint execution: plan, implement, validate, document, and commit continuously using codex/branch/<sprint-id>/.
---

# Sprint Loop

Single source of truth for end-to-end sprint delivery in this repository.

This skill is the default workflow for this repo.

## Inputs

- Sprint ID
- Branch (user-driven naming)
- Sprint docs in `codex/branch/<sprint-id>/`

## Files You Must Maintain

- `codex/branch/<sprint-id>/sprint-plan.md`
- `codex/branch/<sprint-id>/PR.md`

## Sprint ID Convention

- Format is required: `YYYY-MM-DD_feat_<kebab-name>`
- Example: `2026-02-27_feat_typescript-migration-2`
- `codex/current-sprint` must always contain the active sprint ID.

## Architecture Target (TS Migration Work)

- Prefer TypeScript-first business logic in `ts/core/*`.
- Keep `src/*.gs` focused on Apps Script runtime boundaries only:
  - SpreadsheetApp/HtmlService/Utilities APIs,
  - entrypoints/triggers/menu functions,
  - thin adapter glue.
- Export typed logic via `ts/apps-script/entry.ts` and generated bundle.
- Add or update Node tests when moving logic into TypeScript.

## Required Preflight (Before Coding)

1. Read `sprint-plan.md` and `PR.md` in the active sprint folder.
2. Confirm objective, in-scope tasks, acceptance criteria, and constraints.
3. Check git status and active branch.
4. Identify the next smallest task chunk that delivers measurable progress.
5. Decide the validation commands needed for that chunk.

## Workflow

1. Plan
   - Read `sprint-plan.md`.
   - Confirm objective, scope in/out, tasks, acceptance criteria.
   - If needed, tighten scope before coding.
2. Execute
   - Implement one task at a time from `Task Checklist`.
   - Keep work aligned to acceptance criteria.
   - Prefer TS extraction of pure logic before changing runtime wrappers.
   - Commit as you complete meaningful units of work; do not wait until sprint end.
   - Use descriptive commit messages that state the specific task/change.
3. Document Continuously
   - After each completed task, update `PR.md`:
     - change made,
     - reason,
     - validation evidence,
     - residual risk or follow-up.
4. Validate
   - Run relevant checks for your code changes.
   - Typical set (use what applies): `npm run typecheck`, `npm test`, `npm run build:typed`.
   - Record exact command results in `PR.md` Test Evidence.
5. Close
   - Ensure open items are explicit in `Follow-Ups`.
   - Ensure `sprint-plan.md` checklist reflects final task state.

## Branch Guidance

- Keep Git flow user-driven.
- Use any branch naming convention, but keep one branch per sprint execution.
- Keep commits scoped to sprint work.
- Prefer multiple small commits over one large commit.

## Quality Bar

- Deliver the planned feature scope first.
- Keep documentation current during execution, not only at the end.
- Keep follow-ups explicit when something is out of scope.
- Make validation evidence easy to review in `PR.md`.
- Avoid large mixed commits; keep each commit auditable to a task chunk.

## Definition Of Done

- Planned scope completed or explicitly de-scoped with rationale.
- `PR.md` includes clear change log and test/validation evidence.
- Commits are incremental, descriptive, and scoped to sprint work.
