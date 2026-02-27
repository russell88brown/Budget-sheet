# Tag Modeling Guide

This guide describes how tag-based planning works in the app.

## Core Model

- User-facing selector uses `Tag`.
- `Base` is always included in run selections.
- Optional additional tags can be selected with multi-select.
- Legacy `Scenario` input headers are still accepted for compatibility.

## Where Tags Live

- Settings catalog: `Settings!H2:H`
- Named range: `ScenarioList` (legacy name retained for compatibility)

## Tag-Aware Input Sheets

- `Accounts`
- `Income`
- `Expense`
- `Transfers`
- `Policies`
- `Goals`

Rows without an explicit tag default to `Base` behavior.

## Run Behavior

- `Run Budget...` accepts one or more selected tags.
- Engine always includes `Base` and then any selected additional tags.
- Unknown tag values on included rows are auto-disabled during integrity checks.

## Metadata + Run Log

- `Settings!B5:B8`: last run mode/tag/time/status
- `Settings!J:N`: append-only run log (`Run At`, `Mode`, `Tag`, `Status`, `Notes`)

## Notes

- Internally, some function names still use `scenario` for backward compatibility.
- Output headers are tag-oriented where user-facing (`Tag`).
