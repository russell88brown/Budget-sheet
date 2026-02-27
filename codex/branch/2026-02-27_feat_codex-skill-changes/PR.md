# PR Notes: 2026-02-27_feat_codex-skill-changes

## Summary
Consolidated Codex process docs and tooling into a single-skill, two-template workflow under `codex/`.

## Sprint Plan Reference
- Sprint folder: `codex/branch/2026-02-27_feat_codex-skill-changes/`
- Plan file: `codex/branch/2026-02-27_feat_codex-skill-changes/sprint-plan.md`

## Completed Scope
- [x] Single canonical skill at `codex/SKILL.md`.
- [x] Two templates only for plan/PR.
- [x] History stored under `codex/branch/<sprint-id>/`.
- [x] Legacy `.codex` folder removed from this branch.

## Change Log
| Date | Change | Reason | Impact |
|---|---|---|---|
| 2026-02-27 | Reworked sprint layout from `.codex` to `codex/`. | Simplify structure and remove duplication. | Lower onboarding overhead and fewer path mismatches. |
| 2026-02-27 | Updated sprint tooling to use `codex/branch` and two required docs. | Match the simplified process contract. | `sprint:start` and `sprint:check` align with desired structure. |
| 2026-02-27 | Consolidated to single skill workflow in `codex/SKILL.md`. | Reduce process branching and confusion. | One default loop for planning, delivery, and evidence. |

## Test Evidence
| Type | Command/Method | Result | Notes |
|---|---|---|---|
| Validation | `npm run sprint:check` | Pass | Verified current sprint docs satisfy required sections. |
| Unit | Not run | N/A | No product code changes in this sprint. |
| Typecheck | Not run | N/A | No TS/runtime changes in this sprint. |
| Manual | Repo/doc review | Pass | Verified canonical path consistency across codex/docs/tooling. |

## Risks
- Minor typo remains in filename `sprint_tempalte-plan.md` and can be corrected in a dedicated follow-up.

## Definition Of Done Check
- [x] Scope delivered
- [x] Evidence captured
- [x] Risks/follow-ups documented

## Follow-Ups
- Optional typo fix: rename `sprint_tempalte-plan.md` to `sprint_template-plan.md` and update script/docs references.

