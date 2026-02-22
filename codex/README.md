# Codex Automation: Backlog + Sprint Planning

This folder contains a distinct delivery system with two separate workflows:

1. `Idea Backlog` workflow (always-on intake and triage)
2. `Sprint Workflow` (time-boxed execution and closeout)

Use them together, but keep them logically separate.

## Distinct Workflows

### 1) Idea Backlog (Continuous)

Purpose:
- Capture ideas quickly.
- Score and triage.
- Promote only ready items into sprint candidates.

Recommended artifact:
- `codex/backlog/ideas.md` with status values such as `new`, `triaged`, `ready`, `rejected`.

### 2) Sprint Workflow (Execution)

Purpose:
- Convert `ready` ideas into committed sprint items.
- Execute branch/test gates.
- Produce closeout evidence.

Location:
- `codex/sprint-workflow/`

Core files:
- `codex/sprint-workflow/SKILL.md`
- `codex/sprint-workflow/workflows/active-workflows.md`
- `codex/sprint-workflow/workflows/00-start-sprint.md`
- `codex/sprint-workflow/workflows/10-work-item-loop.md`
- `codex/sprint-workflow/workflows/20-close-sprint.md`

## Run Locally

Initialize a sprint workspace:

```powershell
powershell -ExecutionPolicy Bypass -File codex/sprint-workflow/scripts/init-sprint.ps1 -SprintId sprint-2026-03-01 -SprintLead your-name -Items ITEM-101,ITEM-102
```

Then execute workflow phases in order:
1. `codex/sprint-workflow/workflows/00-start-sprint.md`
2. `codex/sprint-workflow/workflows/10-work-item-loop.md` (repeat per item)
3. `codex/sprint-workflow/workflows/20-close-sprint.md`

## CI Options

Two practical CI triggers:

1. `On branch create` for sprint branches:
- Trigger when a branch like `sprint/*` is created.
- Auto-generate sprint artifacts (plan, item files, closeout).
- Optionally commit scaffold files back to that branch.

2. `On push / pull_request` for active sprint branches:
- Run validation checks (tests/lint/static checks).
- Enforce sprint quality gates before merge.

### GitHub Actions Example (Branch Creation)

Use:
- `codex/sprint-workflow/ci/github-actions.branch-create.example.yml`

```yaml
name: Codex Sprint Scaffold

on:
  create:

permissions:
  contents: write

jobs:
  scaffold:
    if: github.event.ref_type == 'branch' && startsWith(github.event.ref, 'sprint/')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ github.event.ref }}
      - name: Initialize sprint files
        shell: pwsh
        run: |
          ./codex/sprint-workflow/scripts/init-sprint.ps1 -SprintId "${{ github.event.ref }}" -SprintLead "ci"
      - name: Commit scaffold
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add codex/sprints/
          if ! git diff --cached --quiet; then
            git commit -m "chore: initialize sprint workspace for ${{ github.event.ref }}"
            git push
          fi
```

Validation workflow example:
- `codex/sprint-workflow/ci/github-actions.sprint-validation.example.yml`

## Recommended Branch Strategy

- `main`: stable integration branch.
- `sprint/<sprint-id>`: sprint-level coordination branch.
- `feat/<item-id>-<slug>` or `fix/<item-id>-<slug>`: per-item implementation branch.

This keeps backlog automation separate from sprint execution automation while still allowing CI enforcement across both.
