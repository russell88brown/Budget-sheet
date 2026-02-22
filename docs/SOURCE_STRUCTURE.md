# Source Structure Guide

This document explains how `src/` is organized so users, administrators, and maintainers can find the right code quickly.

## Goals

- Keep runtime behavior unchanged while making the codebase easier to navigate.
- Separate user-facing UI/setup concerns from forecast engine internals.
- Keep Apps Script/clasp compatibility (`src/**` remains the deploy root).

## Folder Layout

- `src/appsscript.json`: Apps Script manifest.
- `src/config`: global constants and schema definitions.
- `src/ui`: menu wiring and HTML dialogs.
- `src/admin`: setup, default seeding, and export admin actions.
- `src/engine`: input readers, recurrence/event generation, and forecast core pipeline.
- `src/reports`: journal writer and summary/dashboard builders.
- `src/shared`: common helpers used across modules.
- `src/tests`: deterministic fixture test runners.

## Where To Start

- New user issue with menu actions: `src/ui/01_Menu.gs`.
- Setup/data-validation issue: `src/admin/05_Setup.gs`.
- Forecast math or rule behavior: `src/engine/`.
- Output rendering issue (Journal/Daily/Monthly/Dashboard): `src/reports/`.
- Regression verification: `src/tests/98_FixtureTests.gs`.

## Notes For Administrators

- `clasp` deploys recursively from `src/`; nested folders are supported with no workflow change.
- Existing CI triggers on `src/**`, so this structure stays compatible with current workflows.
- Manual copy workflows should copy all `.gs` and `.html` files under `src/` (including subfolders).
