---
name: sprint-review-retro
description: Use when the user asks to review a sprint PR, identify delivery/test/documentation gaps, and write or refine .codex/sprints/<sprint-id>/retro.md with wins, issues, root causes, and action items.
---

# Sprint Review Retro

Review delivery quality, then write a concrete sprint retrospective.

If needed, load [references/review-retro-checklist.md](references/review-retro-checklist.md).

## Workflow

1. Review `.codex/sprints/<sprint-id>/PR.md` and code deltas.
2. Identify:
   - missing tests,
   - risk regressions,
   - acceptance criteria not fully met,
   - documentation gaps.
3. Record findings in review feedback.
4. Write or update `.codex/sprints/<sprint-id>/retro.md` with:
   - wins,
   - issues,
   - root causes,
   - process changes for next sprint,
   - action items with owner and due date.

## Quality Bar

- Retro actions must be specific and assignable.
- Root causes should target process/system, not individuals.
- Include at least one preventive action for repeated issues.
