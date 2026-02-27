Subject: Codex Local Development Setup

# Codex Development Notes

This document covers repository setup and usage notes for Codex in this project.

## Config Files

Two config files are used:

- `codex/config.example.toml` (committed): shared baseline for the repo
- `codex/config.toml` (local): your machine-specific Codex config

`codex/config.toml` is intentionally ignored by git.

Typical setup:

1. Copy the example file:
   - PowerShell: `Copy-Item codex/config.example.toml codex/config.toml`
2. Adjust local values in `codex/config.toml` as needed.

## Suggested Local Defaults

Current repo defaults in the example file are:

```toml
model = "gpt-5"
approval_policy = "on-request"
sandbox_mode = "workspace-write"

[tools]
web_search = true
```

Use stricter or looser settings locally depending on your risk tolerance.

## Windows and WSL Note

On Windows, Codex is generally smoother in WSL (Ubuntu) than native PowerShell, especially for command approval behavior and shell edge cases.

Recommended path:

1. Install WSL2 + Ubuntu.
2. Clone/open this repo inside the WSL filesystem.
3. Run Codex from the WSL terminal.

## Repo Hygiene

- Keep secrets and machine-specific settings only in local ignored files.
- Commit only example/template config files.
- If shared defaults change, update `codex/config.example.toml` and this doc together.

## Backlog And Sprint Automation

This section is the source of truth for planning, executing, and closing sprints with Codex.

### Folder Contract

Each sprint is stored in `.codex/sprints/<sprint-id>/` with:

- `sprint-plan.md`
- `PR.md`
- `retro.md`

Templates live in `.codex/templates/`.

### End-To-End Flow

1. On `main`, define sprint scope and acceptance in `sprint-plan.md`.
2. Start sprint scaffolding and branch:
   - `npm run sprint:start -- <sprint-id>`
3. Implement on `sprint/<sprint-id>`.
4. Update `PR.md` continuously as tasks complete.
5. Before opening/updating PR, run:
   - `npm run sprint:check`
6. Review delivery quality and complete `retro.md`.
7. Merge when acceptance criteria and checks are satisfied.

### Commands

Start sprint docs and branch:

```bash
npm run sprint:start -- <sprint-id>
```

Start docs only (no branch create):

```bash
npm run sprint:start -- <sprint-id> --no-branch
```

Validate required sprint docs and section completeness:

```bash
npm run sprint:check
```

### Skills

- `sprint-planner`
  - builds/refines `.codex/sprints/<sprint-id>/sprint-plan.md`
- `sprint-executor`
  - executes plan items and maintains `.codex/sprints/<sprint-id>/PR.md`
- `sprint-review-retro`
  - reviews PR outcomes and writes `.codex/sprints/<sprint-id>/retro.md`

### Commit Safety

Always enforce commit scope during sprint execution:

1. Verify branch:
   - `git branch --show-current`
2. Stage only intended files:
   - `git add <file1> <file2>`
3. Verify staged scope:
   - `git diff --cached --name-only`
4. Optional deterministic guard:
   - `node .codex/skills/sprint-executor/scripts/guard-commit.mjs <sprint-id> .codex/ src/ tests/ scripts/`
