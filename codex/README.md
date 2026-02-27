# Codex Sprint Layout

Primary rule:

- `codex/SKILL.md` is the authoritative sprint process.

Canonical structure:

- `codex/SKILL.md`
- `codex/sprint_tempalte-plan.md`
- `codex/sprint_template-pr.md`
- `codex/branch/<sprint-id>/`

Sprint loop (summary only; details live in `codex/SKILL.md`):

1. `npm run sprint:start -- <sprint-id> --no-branch`
2. Create/switch branch.
3. Fill `codex/branch/<sprint-id>/sprint-plan.md`.
4. Build the feature and keep `codex/branch/<sprint-id>/PR.md` updated.
5. Commit as you go with descriptive messages for each completed task chunk.
6. Run relevant validation for the changes made.

Notes:

- Legacy `.codex/` layout has been removed.
- `retro.md` can be used optionally in `codex/branch/<sprint-id>/` for additional closure notes.

