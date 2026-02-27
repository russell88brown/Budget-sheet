# Budget Forecast Engine

Budget Forecast Engine turns your sheet into a deterministic budget simulator.

## Quick Start

1. Open `Budget Forecast -> Setup actions...`
2. Run `Fix Structure`, `Fix Rules`, `Fix Theme`
3. Optional: run `Load Defaults`
4. Open `Budget Forecast -> Run Budget...`
5. Select operations and tags, then run

## Daily Use

- Update input sheets: `Accounts`, `Income`, `Expense`, `Transfers`, `Policies`, `Goals`
- Run `Generate journal` first
- Then run `Generate daily`, `Generate monthly`, `Generate dashboard` as needed

## Tags

- User-facing selection is `Tag`
- `Base` is always included
- You can add one or more extra tags in the run dialog
- Legacy `Scenario` columns remain supported for compatibility

## Documentation

| Document | Purpose |
|---|---|
| `docs/README.md` | Documentation index (app docs vs tooling docs). |
| `docs/TECHNICAL.md` | Full technical reference (starts with source architecture map). |
| `docs/SCENARIOS.md` | Tag/scenario modeling guidance and examples. |
| `src/README.md` | Source-module map only (`A/B/C/D/E/F/Z` sections). |
| `docs/TEST_CASES.md` | Manual regression test cases. |
| `docs/tooling/CLASP.md` | Apps Script/clasp setup notes. |
| `docs/tooling/CI.md` | CI and deploy/test automation notes. |
| `docs/tooling/CODEX.md` | Local contributor workflow notes. |
