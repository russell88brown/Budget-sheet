# Codex Sprint Layout

Canonical structure:

- `codex/skill/SKILL.md`
- `codex/sprint_tempalte-plan.md`
- `codex/sprint_template-pr.md`
- `codex/history/<sprint-id>/`

Sprint loop:

1. `npm run sprint:start -- <sprint-id> --no-branch`
2. Create/switch branch (user-driven).
3. Fill `codex/history/<sprint-id>/sprint-plan.md`.
4. Build the feature and keep `codex/history/<sprint-id>/PR.md` updated.
5. Run `npm run sprint:check`.
