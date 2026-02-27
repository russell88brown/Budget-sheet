# Workflow 10: Execute Work Item

1. Select next `queued` item and set status to `in_progress`.
2. Switch to item branch from sprint branch:
   - naming: `feat/<item-id>-<slug>` or `fix/<item-id>-<slug>`
3. Rebase or merge latest sprint branch.
4. Implement minimal change set for acceptance criteria.
5. Run item-focused validation:
   - targeted tests for touched behavior
   - lint or static checks relevant to changed files
6. Update item evidence:
   - commands run
   - test output summary
   - risks and follow-ups
7. Self-review diff for unintended changes.
8. Commit with scoped message referencing item id.
9. Mark status:
   - `blocked` with reason, or
   - `ready_for_review` when gates pass
10. Return to sprint branch and integrate item branch per team policy.

Exit criteria:
- Item acceptance criteria verified.
- Evidence logged.
- Integration path clear (PR or direct merge policy documented).

