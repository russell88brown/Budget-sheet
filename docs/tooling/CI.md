# CI / PR Automation

This project includes GitHub Actions for Apps Script deployment and PR validation.

## Workflows

- `.github/workflows/deploy-main.yml`
  - Trigger: push to `main` (and manual dispatch)
  - Action: run `npm run verify`, then push local `src/` to production Apps Script project
- `.github/workflows/pr-test.yml`
  - Trigger: pull requests targeting `main` (and manual dispatch)
  - Action: run `npm run verify`, then push local `src/` to test Apps Script project and run deterministic fixture tests

Both workflows use `scripts/pr-tools.mjs`.

## Required GitHub Secrets

- `CLASP_CREDENTIALS_JSON`
  - full JSON contents of local `~/.clasprc.json`
- `CLASP_SCRIPT_ID_PROD`
  - Apps Script project ID bound to production spreadsheet
- `CLASP_SCRIPT_ID_TEST`
  - Apps Script project ID bound to test spreadsheet

## Local commands (same flow as CI)

```powershell
npm run verify
npm run pr:deploy-main
npm run pr:test-branch
```

`npm run verify` currently runs TypeScript typecheck, typed-node tests, and typed bundle generation.

Environment variables:

- `CLASP_SCRIPT_ID_PROD` for `pr:deploy-main`
- `CLASP_SCRIPT_ID_TEST` for `pr:test-branch`
- `CLASP_CREDENTIALS_JSON` (optional locally, required in CI)
- `TEST_RUNNER_FUNCTION` (optional; default `runDeterministicFixtureTests_All`)

Example:

```powershell
$env:CLASP_SCRIPT_ID_TEST = "YOUR_TEST_SCRIPT_ID"
npm run pr:test-branch
```

