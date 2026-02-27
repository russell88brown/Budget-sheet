# Sprint Plan: feat-fixtures-branch

## Metadata
- Sprint ID: `feat-fixtures-branch`
- Start date (YYYY-MM-DD): 2026-02-27
- End date (YYYY-MM-DD): 2026-03-06
- Owner: User + Codex
- Branch: `codex/feat-fixtures-branch`

## Objective
Create a repeatable `codex` sprint workflow that is first-time friendly and optimized for AI planning, execution tracking, and documentation quality.

## Scope In
- Improve core process documentation in `codex/README.md` and `docs/tooling/CODEX.md`.
- Update skill instructions so first-sprint and custom branch cases are supported.
- Improve `codex` templates so new sprints start with clearer, actionable structure.
- Complete this sprint's `sprint-plan.md` and `PR.md` with concrete content.
- Validate sprint documentation using `npm run sprint:check`.

## Scope Out
- Application feature code changes under `src/`, `tests/`, or `ts/`.
- CI/CD or deployment pipeline changes.
- Refactoring `scripts/sprint-tools.mjs` behavior.

## Task Checklist
- [x] Review current sprint-skill documentation and identify process gaps.
- [x] Update first-time and branch-flexibility guidance in sprint skill docs.
- [x] Simplify execution checklist to keep Git user-driven and minimal.
- [x] Improve sprint templates for better repeatability.
- [x] Update central process documentation to emphasize AI planning/execution/docs loop.
- [x] Run sprint validation and capture evidence in `PR.md`.

## Acceptance Criteria
- Sprint documentation clearly supports first-time usage with no prerequisite prior sprint.
- Workflow allows either default sprint branch naming or user-driven custom branch naming.
- Template files under `codex/` provide actionable structure without placeholder-only sections.
- Current sprint docs under `codex/history/feat-fixtures-branch/` pass `npm run sprint:check`.

## Constraints
- Keep improvements focused on `codex` assets and process documentation.
- Keep instructions concise and repeatable for non-expert users.
- Prefer stable conventions while allowing user-driven Git operations.

## Definition Of Done
- [x] Documentation updates implemented
- [x] `PR.md` updated with evidence
- [x] `npm run sprint:check` passes

## Risks And Mitigations
- Risk: mixed legacy folder names may confuse contributors.
  Mitigation: use `codex/history` as canonical path in docs and templates.
- Risk: contributors may over-focus on Git steps and under-document outcomes.
  Mitigation: keep checklists AI-work-output focused, with lightweight Git guidance only.
