# Codex Sprint Workflow

## Sprint Files

Each sprint lives in `.codex/sprints/<sprint-id>/` and must contain:

- `sprint-plan.md`
- `PR.md`
- `retro.md`

Templates are in `.codex/templates/`.

## Commands

Start a sprint:

```bash
npm run sprint:start -- <sprint-id>
```

Start a sprint without creating a git branch:

```bash
npm run sprint:start -- <sprint-id> --no-branch
```

Validate sprint docs:

```bash
npm run sprint:check
```

## Branch Model

1. Create/refine sprint plan on `main`.
2. Create `sprint/<sprint-id>` branch.
3. Implement tasks and update `PR.md` continuously.
4. Complete `retro.md` at sprint close.

## Commit Safety Rules

1. Verify branch before editing: `git branch --show-current`
2. Stage only explicit paths: `git add <file1> <file2>`
3. Verify staged scope: `git diff --cached --name-only`
4. Confirm unrelated files remain uncommitted after each commit.

## Skills

- `sprint-planner`: create and refine sprint plans.
- `sprint-executor`: execute sprint tasks and maintain `PR.md`.
- `sprint-review-retro`: review delivery quality and write retrospectives.

Each skill includes:

- `agents/openai.yaml` for UI metadata/discovery
- `references/` for checklist-level guidance
- (executor only) `scripts/guard-commit.mjs` for deterministic branch and staged-file checks
