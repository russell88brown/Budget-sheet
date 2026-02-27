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

### Folder Contract (`codex`)

- Skill: `codex/SKILL.md`
- Plan template: `codex/sprint_tempalte-plan.md`
- PR template: `codex/sprint_template-pr.md`
- Sprint history: `codex/history/<sprint-id>/`

### First-Time Quickstart (Repeatable)

Use this exact flow for your first sprint and every sprint after that.

1. Start from `main`.
2. Choose sprint ID (example: `feat-fixtures-branch`).
3. Scaffold sprint docs:
   - `npm run sprint:start -- <sprint-id> --no-branch`
4. Create/switch branch in your preferred way (user-driven).
5. Fill required sections in:
   - `codex/history/<sprint-id>/sprint-plan.md`
   - `codex/history/<sprint-id>/PR.md`
6. Validate docs before implementation:
   - `npm run sprint:check`
7. Implement work, updating `PR.md` continuously.
8. Before PR/merge, run final checks.

### End-To-End Flow (Default Convention)

1. On `main`, define sprint scope and acceptance in `sprint-plan.md`.
2. Start sprint scaffolding and branch:
   - `npm run sprint:start -- <sprint-id>`
3. Implement on `sprint/<sprint-id>`.
4. Update `PR.md` continuously as tasks complete.
5. Before opening/updating PR, run:
   - `npm run sprint:check`
6. Merge when acceptance criteria and checks are satisfied.

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

### Repeatability Rules

- Keep one sprint folder per sprint ID.
- Keep `PR.md` as a running log; do not backfill only at the end.
- Run `npm run sprint:check` at least once before coding and once before PR.
- Keep Git operations lightweight and user-driven; focus AI effort on plan quality, execution tracking, and documentation evidence.

### If You Want A Different Structure

Current automation is hard-wired to these paths in `scripts/sprint-tools.mjs`:

- `codex/sprint_tempalte-plan.md`
- `codex/sprint_template-pr.md`
- `codex/history/`
- `codex/current-sprint`

If you want another root, update those constants in `scripts/sprint-tools.mjs` once, then keep that structure stable across sprints.

### Skill

- `sprint-loop`
  - single end-to-end loop: plan, execute, and maintain `PR.md`.

### Commit Safety

Keep commit safety simple:

1. Stage only what belongs to this sprint.
2. Check staged files once before commit.
