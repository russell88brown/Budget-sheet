# Codex Development Notes

This document covers repository setup and usage notes for Codex in this project.

---

## 1) Config Files

Two config files are used:

- `codex/config.example.toml` (committed): shared baseline for the repo
- `codex/config.toml` (local): your actual machine-specific Codex config

`codex/config.toml` is intentionally ignored by git.

Typical setup:

1. Copy the example file:
   - PowerShell: `Copy-Item codex/config.example.toml codex/config.toml`
2. Adjust local values in `codex/config.toml` as needed.

---

## 2) Suggested Local Defaults

Current repo defaults in the example file are:

```toml
model = "gpt-5"
approval_policy = "on-request"
sandbox_mode = "workspace-write"

[tools]
web_search = true
```

Use stricter or looser settings locally depending on your risk tolerance.

---

## 3) Windows + WSL Note

On Windows, Codex is generally smoother when run inside WSL (Ubuntu) rather than native PowerShell, especially if you want stable command-approval behavior and fewer shell edge cases.

Short recommendation:

1. Install WSL2 + Ubuntu.
2. Clone/open this repo inside the WSL filesystem.
3. Run Codex from the WSL terminal.

This setup tends to produce more predictable tool execution and auto-approval flows than mixed Windows/WSL path setups.

---

## 4) Repo Hygiene

- Keep secrets and machine-specific settings only in local ignored files.
- Commit only example/template config files.
- If shared defaults change, update `codex/config.example.toml` and this doc together.
