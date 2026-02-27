# Sprint Retro: feat-fixtures-branch

## Wins
- Process documentation now supports first-time sprint execution without hidden prerequisites.
- Sprint skills are aligned with user-driven branch naming and simpler Git behavior.
- Templates now start from actionable structure, improving future sprint quality.

## Issues
- Initial templates had placeholder-heavy content that failed validation unless manually overhauled.

## Root Causes
- Initial process docs optimized for an idealized workflow, not first-time onboarding reality.
- Naming conventions evolved over time without a single canonical migration step.

## What To Change Next Sprint
- Keep the `codex/` layout stable and avoid introducing alternate metadata roots.
- Add a brief "new sprint checklist" at repo root to reduce context switching into multiple docs.

## Action Items
| Action | Owner | Due Date | Status |
|---|---|---|---|
| Keep one canonical metadata root (`codex/`) and reject new parallel roots. | User | 2026-03-06 | In Progress |
| Add a short pointer from root `README.md` to sprint quickstart section in `docs/tooling/CODEX.md`. | Codex | 2026-03-06 | Open |
