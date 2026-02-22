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

Codex backlog and sprint execution are documented as a distinct workflow in:

- `codex/README.md`

Use that file for:
- automatic idea backlog structure,
- sprint planning and execution segmentation,
- CI trigger patterns (including branch-create trigger for `sprint/*`).
