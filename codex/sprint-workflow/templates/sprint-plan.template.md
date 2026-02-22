# Sprint {{SPRINT_ID}} Plan

## Sprint Metadata

- Sprint ID: `{{SPRINT_ID}}`
- Created: `{{DATE}}`
- Sprint lead: `{{SPRINT_LEAD}}`
- Base branch: `{{BASE_BRANCH}}`
- Sprint branch: `sprint/{{SPRINT_ID}}`

## Goal

`{{SPRINT_GOAL}}`

## Definition Of Done

- [ ] Acceptance criteria met for committed scope
- [ ] Required tests passing
- [ ] Docs or changelog updated where needed
- [ ] Risk notes captured for unresolved items

## Quality Gates

- Required checks: `{{REQUIRED_CHECKS}}`
- Merge policy: `{{MERGE_POLICY}}`
- Release policy: `{{RELEASE_POLICY}}`

## Item Backlog

| Item ID | Summary | Priority | Owner | Status |
|---|---|---|---|---|
| {{ITEM_ID_1}} | {{SUMMARY_1}} | P1 | {{OWNER_1}} | queued |
| {{ITEM_ID_2}} | {{SUMMARY_2}} | P2 | {{OWNER_2}} | queued |

## Branch And Test Policy

- Item branch naming: `feat/<item-id>-<slug>` or `fix/<item-id>-<slug>`
- Minimum per-item validation: targeted tests plus lint/static checks
- End-of-sprint validation: full regression before closeout

