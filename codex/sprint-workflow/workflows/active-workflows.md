# Active Workflow Segmentation

## Phase 0: Sprint Setup

- Workflow: `workflows/00-start-sprint.md`
- Status: `active`
- Output:
  - `codex/sprints/<sprint-id>/sprint-plan.md`
  - `codex/sprints/<sprint-id>/closeout.md`
  - `codex/sprints/<sprint-id>/items/*.md`

## Phase 1: Work Item Loop

- Workflow: `workflows/10-work-item-loop.md`
- Status: `active`
- Repeats: once per sprint item
- Gate: targeted tests must pass before moving to next item

## Phase 2: Sprint Validation and Closeout

- Workflow: `workflows/20-close-sprint.md`
- Status: `active`
- Gate: regression checks and release readiness notes completed

