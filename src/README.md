# Budget Sheet Source Guide

This folder contains the Apps Script runtime for setup, inputs, journal generation, summaries, and dashboard output.

## How The App Flows

1. Setup builds sheets, rules, and defaults.
2. Inputs are read and scoped by tag.
3. Journal rows are generated from events.
4. Daily/Monthly summaries and dashboard are derived from Journal.
5. Menu/UI orchestrates runs and exports.

## Source Layout

| Section | Purpose | Files |
|---|---|---|
| `A` | Setup (operational) | `A01`-`A03` |
| `B` | Utilities/foundation (utility) | `B01`-`B08` |
| `C` | Inputs + run model (operational) | `C01`-`C03` |
| `D` | Journal pipeline (operational) | `D01`-`D05` |
| `E` | Other summaries + dashboard (operational) | `E01`-`E02` |
| `F` | Menu/UI/export (operational) | `F01`-`F04` |
| `Z` | Deterministic fixture tests | `Z01` |

## Tag Model

- User-facing key is `Tag`.
- `Base` is always included in run selections.
- Legacy `Scenario` header aliases are removed; inputs must use `Tag`.

## Typed Migration

- Typed source: `ts/`
- Node tests: `tests/`
- Typecheck: `npm run typecheck`
- Typed adapter bridge: `src/B07_TypedAdapters.gs`
- Generated runtime bundle: `src/B08_TypedBudget.generated.gs`

## Docs

| Doc | Purpose |
|---|---|
| `docs/TECHNICAL.md` | Detailed architecture, runtime flow, and module responsibilities. |
| `docs/SCENARIOS.md` | Tag behavior and run selection rules. |
| `docs/TEST_CASES.md` | Manual regression checklist. |
| `docs/tooling/CI.md` | CI workflows and required secrets. |
| `docs/tooling/CLASP.md` | Apps Script sync setup and local push/pull workflow. |
