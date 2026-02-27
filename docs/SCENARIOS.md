# Tag Behavior Guide

`Tag` is the user-facing planning scope key.

## Run Selection Rules

- `Base` is always included.
- Users can add one or more extra tags from the run dialog multi-select.
- Unknown tag values in included rows are auto-disabled during integrity checks.

## Storage

- Tag catalog values are stored in `Settings!H2:H`.
- Named range is still `ScenarioList` for backward compatibility.

## Input Sheets Using Tag Scope

- `Accounts`
- `Income`
- `Expense`
- `Transfers`
- `Policies`
- `Goals`

Rows with blank tag values run as `Base`.

## Compatibility Notes

- Legacy `Scenario` column headers are still accepted.
- Internal helper names may still use `scenario` for compatibility, while UI/output labels remain tag-oriented.
