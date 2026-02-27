# Sprint Plan: 2026-02-27_feat_codex-skill-changes

## Metadata
- Sprint ID: `2026-02-27_feat_codex-skill-changes`
- Start date (YYYY-MM-DD): 2026-02-27
- End date (YYYY-MM-DD): 2026-02-27
- Owner: User + Codex
- Branch: `2026-02-27_feat_codex-skill-changes`

## Objective
Consolidate Codex workflow into one skill and one metadata structure under `codex/`.

## Scope In
- Use one skill file: `codex/SKILL.md`.
- Keep two templates only: `codex/sprint_tempalte-plan.md` and `codex/sprint_template-pr.md`.
- Maintain sprint records in `codex/branch/<sprint-id>/`.
- Remove legacy `.codex` references from active docs.

## Scope Out
- Feature implementation work in `src/` and `tests/`.
- CI/CD pipeline changes.

## Task Checklist
- [x] Move to one-skill model.
- [x] Update `scripts/sprint-tools.mjs` for `codex/` paths and two-document validation.
- [x] Migrate active sprint artifacts to `codex/branch/`.
- [x] Remove legacy `.codex` metadata folder from the branch.
- [x] Validate with `npm run sprint:check`.

## Acceptance Criteria
- `sprint:start` creates `sprint-plan.md` and `PR.md` under `codex/branch/<sprint-id>/`.
- `sprint:check` validates required sections for those two files.
- `codex/README.md` and `docs/tooling/CODEX.md` describe the same structure.

## Constraints
- Keep Git flow user-driven.
- Keep process simple and repeatable.

## Definition Of Done
- [x] Planned scope implemented
- [x] Validation/test evidence recorded
- [x] `PR.md` updated with evidence

## Risks And Mitigations
- Risk: path drift between docs and scripts.
  Mitigation: keep canonical paths documented in both `codex/README.md` and `docs/tooling/CODEX.md`.

