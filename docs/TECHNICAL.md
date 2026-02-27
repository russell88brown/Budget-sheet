Subject: Budget Forecast Engine Full Technical Reference

# Technical Reference

This document is the implementation reference for the Budget Forecast Engine (Google Apps Script), covering functionality, behavior, and current use cases.

---

## Run modes and guarantees

- `Forecast`
  - Runs full preprocess (`normalize`, `validate`, and expiry updates) before compile/apply.
  - Deterministic output for unchanged validated inputs.
- `Journal`
  - Runs core integrity checks before compile/apply (scenario/account checks plus Income/Transfer/Expense required-account checks).
  - Invalid included core rows are auto-disabled before journal generation.
- `Daily` / `Monthly` / `Dashboard`
  - Build from Journal as source of truth.
  - Reconciliation assertions validate Daily vs Journal and Monthly vs Daily.
- User-data dependency
  - Results still depend on configured Includes, dates, accounts, and amounts even when deterministic guarantees hold.

---

## 1) Architecture

Two layers:

1. **Google Sheets workbook** (state + inputs + outputs)
2. **Apps Script runtime** (forecast engine + writers + formatters)

The workbook is the source of truth. Outputs are deterministically regenerated on each run; there is no hidden state in code.

### Current program of work

- Week 1 (completed): extract domain core for event compile/apply, keep behavior unchanged, add deterministic fixture runners.
- Week 2 (in progress): add stable rule traceability (`Rule ID` -> `Source Rule ID`) with lightweight dashboard explainability for negative-cash contributors.
- Next: scenario comparison metrics and onboarding/sanity checks.

---

## 2) Sheet Model

### Inputs

#### Accounts
- Columns: Account Name, Balance, Type, Include, Expense Avg / Month, Income Avg / Month, Net Cash Flow / Month, Interest Rate (APR %), Interest Fee / Month, Interest Method, Interest Frequency, Interest Repeat Every, Interest Start Date, Interest End Date
- Type: enum { Cash, Credit }
- Include: boolean, controls whether account appears in forecast outputs

#### Income
- Columns: Include, Scenario, Rule ID, Monthly Total, Type, Name, Amount, Frequency, Repeat Every, Start Date, End Date, To Account, Notes
- Include: boolean, if false rule is ignored
- Frequency: enum (Daily, Monthly, Yearly)

#### Expense
- Columns: Include, Scenario, Rule ID, Monthly Total, Type, Name, Amount, Frequency, Repeat Every, Start Date, End Date, From Account, Notes

#### Transfers
- Columns: Include, Scenario, Rule ID, Monthly Total, Type, Name, Amount, Frequency, Repeat Every, Start Date, End Date, From Account, To Account, Notes
- Transfer Type: enum { Repayment - Amount, Repayment - All, Transfer - Amount, Transfer - Everything Except }

#### Policies
- Columns: Include, Scenario, Rule ID, Policy Type, Name, Priority, Start Date, End Date, Trigger Account, Funding Account, Threshold, Max Per Event, Notes
- Policy Type: enum { Auto Deficit Cover }
- Used to inject transfers that cover cash deficits before an event posts.

#### Goals
- Columns: Include, Scenario, Rule ID, Goal Name, Target Amount, Target Date, Priority, Funding Account, Funding Policy, Amount Per Month, Percent Of Inflow, Notes
- Goals are validated and read, but not yet applied in the forecast output.

### Outputs

#### Journal
- Each row is a forecasted event, plus running balances for each forecast account.
- Column shape:
  - Date
  - Scenario
  - Account
  - Transaction Type
  - Name
  - Amount
  - Source Rule ID
  - Alerts
  - One column per forecast account (running balance)

#### Daily
- Snapshot per day from the Journal.
- Columns: Date, Total Cash, Total Debt, Net Position, then one column per forecast account.

#### Monthly
- Aggregated stats per month.
- Header row 1 merges account names across 4 columns.
- Header row 2 is the subheader: Min, Max, Net Change, Ending.

#### Dashboard
- Charts built from the Daily sheet (Cash vs Net, Debt).
- “Financial Healthcheck” table with key stats.
- Horizontal account blocks: Ending, Min, Max, Net Change.

---

## 3) Forecast Pipeline

### a) Preprocess + validate inputs
- Normalize rows and recurrence fields.
- Assign missing stable `Rule ID` values for input rule sheets.
- Validate each input sheet; invalid rows are deactivated.
- Flag rules that are out of date.

### b) Read inputs
- `Readers.readAccounts()` ([src/16_Readers.gs](../src/16_Readers.gs))
- `Readers.readIncome()` ([src/16_Readers.gs](../src/16_Readers.gs))
- `Readers.readExpenses()` ([src/16_Readers.gs](../src/16_Readers.gs))
- `Readers.readTransfers()` ([src/16_Readers.gs](../src/16_Readers.gs))
- `Readers.readPolicies()` ([src/16_Readers.gs](../src/16_Readers.gs))
- `Readers.readGoals()` ([src/16_Readers.gs](../src/16_Readers.gs))

### c) Refresh account summaries (optional)
- `refreshAccountSummaries_()` ([src/19_Engine.gs](../src/19_Engine.gs)) updates monthly averages on the Accounts sheet.

### d) Generate events
- Income rules -> income events
- Expense rules -> expense events
- Transfer rules -> transfer events
- Interest rules -> interest events
  (Implementation: [src/13_Events.gs](../src/13_Events.gs))

### e) Build journal
- `CoreCompileRules` + `CoreApplyEvents` apply events in chronological order and produce running balances.
- Interest accrues daily per account and posts in bulk on configured posting dates.
- Repayment transfers are capped to the remaining credit balance.
- If a credit balance is already >= 0, repayment transfers are skipped once per name.
- `Transfer - Everything Except` keeps the specified amount in the source account and moves any excess.
- Auto deficit cover policies insert transfers to prevent cash accounts from dropping below a threshold.
- Journal rows carry `Source Rule ID` for rule-level traceability.
- Event ordering is deterministic for same-day events via one canonical order list:
  1. Income
  2. Transfer - Amount
  3. Repayment - Amount
  4. Repayment - All
  5. Expense
  6. Interest Accrual
  7. Interest Posting
  8. Transfer - Everything Except
- Same-day ties are resolved by `Source Rule ID`, then `Name`, then normalized event id.

### f) Write outputs
- `Writers.writeJournal()` ([src/20_Writers.gs](../src/20_Writers.gs)) writes the Journal and applies formatting/filters.
- Summary pipeline (from Journal):
  - `buildDailySummary_()` ([src/21_Summary.gs](../src/21_Summary.gs))
  - `writeDailySummary_()` ([src/21_Summary.gs](../src/21_Summary.gs))
  - `buildMonthlySummary_()` ([src/21_Summary.gs](../src/21_Summary.gs))
  - `writeMonthlySummary_()` ([src/21_Summary.gs](../src/21_Summary.gs))
  - `buildDashboardData_()` ([src/21_Summary.gs](../src/21_Summary.gs))
  - `writeDashboard_()` ([src/21_Summary.gs](../src/21_Summary.gs))

---

## 4) Recurrence Engine

Recurrence is anchored and deterministic:

- Each rule has a **Frequency**, **Repeat Every**, and **Start Date**.
- Future dates are generated by stepping forward from the anchor date.
- Monthly+ steps clamp to end-of-month as needed.

Supported frequencies:
- Once, Daily, Weekly, Monthly, Yearly

---

## 5) Money Flow Rules

### Event types
- **Income**: increases account balance
- **Expense**: reduces account balance
- **Transfer**: moves balance between accounts

### Repayment handling
- `Repayment - Amount`: pays the specified amount, capped to outstanding debt.
- `Repayment - All`: always pays outstanding debt in full.
- If a credit account is already paid off, the transfer is skipped.

### Alerts
- `NEGATIVE_CASH`: cash account went negative
- `CREDIT_PAID_OFF`: credit account hit 0 from a repayment

---

## 6) Formatting + Ordering

### Sheet ordering
All major flows call a single ordering routine to ensure consistent tab order:

Dashboard -> Accounts -> Income -> Transfers -> Goals -> Policies -> Expense -> Journal -> Daily -> Monthly -> Settings

### Daily formatting
- Date column formatted as `yyyy-mm-dd`
- Conditional formatting applies only to account balance columns
- When summarizing multiple scenarios, Daily includes a `Scenario` column.

### Journal formatting
- Frozen header row
- Filters applied to the header row
- No post-write sort is applied; generated event order is preserved.
- Conditional formatting:
  - Credit accounts: green if >= 0
  - Cash accounts: red if < 0
  - Alerts: dark red font when `NEGATIVE_CASH`

---

## 7) Export Behavior

- Export dialog allows selecting which core sheets to export.
- Output is delivered as a downloaded `.zip` of JSON files (one per selected sheet, with Journal split options).
- Journal export modes: full single file, split by entry count, or date-range file.

---

## 8) Menu-Level Functionality

Available user actions from **Budget Forecast** menu:
- Run Budget dialog (scenario-aware journal/daily/monthly/dashboard)
- Deterministic fixture tests (Phase 2), including `Run All + Report` with run-log summary
- Export
- Summarise Accounts
- Setup actions

Setup actions include:
- Structure
- Validation + settings
- Theme
- Load default data

---

## 9) Use Cases Covered

- Build an initial forecast from current balances and recurring rules.
- Re-run forecast after changing accounts, income, expenses, or transfers.
- Model debt repayment with capped or pay-all behavior.
- Model cash movement with standard transfers or "everything except" transfers.
- Apply automatic deficit cover policies to protect minimum cash thresholds.
- Generate daily/monthly summaries and dashboard snapshots for planning.
- Export output datasets for sharing or downstream processing.

---

## 10) Source Map

Top-level folders:
- `src/config`: constants and schema
- `src/ui`: menu + dialogs
- `src/admin`: setup/defaults/export
- `src/engine`: readers + recurrence + forecast core
- `src/reports`: Journal and summary writers
- `src/shared`: shared utilities
- `src/tests`: deterministic fixture tests

Main modules:
- [`00_Config.gs`](../src/01_Config.gs) (constants + names)
- [`30_Menu.gs`](../src/30_Menu.gs) (menu wiring + setup dialog)
- [`02_Schema.gs`](../src/02_Schema.gs) (schema definitions)
- [`40_Setup.gs`](../src/40_Setup.gs) (sheet creation + validation)
- [`41_DefaultData.gs`](../src/41_DefaultData.gs) (default seed data)
- [`42_Export.gs`](../src/42_Export.gs) (export routines)
- [`16_Readers.gs`](../src/16_Readers.gs) (input parsing)
- [`17_RunModel.gs`](../src/17_RunModel.gs) (run-model normalization)
- [`13_Events.gs`](../src/13_Events.gs) (event generation)
- [`10_Recurrence.gs`](../src/10_Recurrence.gs) (date stepping)
- [`19_Engine.gs`](../src/19_Engine.gs) (forecast pipeline)
- [`12_CoreModel.gs`](../src/12_CoreModel.gs) (domain model helpers)
- [`14_CoreCompile.gs`](../src/14_CoreCompile.gs) (rule compile stage)
- [`15_CoreApply.gs`](../src/15_CoreApply.gs) (event application stage)
- [`20_Writers.gs`](../src/20_Writers.gs) (journal writer)
- [`21_Summary.gs`](../src/21_Summary.gs) (daily/monthly/dashboard)

---

## 11) Determinism + State

- Outputs are fully reproducible.
- Inputs are the only state.
- Rerunning forecast always regenerates Journal and downstream summaries.

## 11.1) Traceability boundary (Week 2)

- Implemented now:
  - Stable `Rule ID` columns on rule inputs.
  - Automatic assignment of missing `Rule ID` values during preprocessing.
  - `Source Rule ID` written to Journal rows.
  - Dashboard block `Negative Cash Top Sources` (top 5 by absolute amount across `NEGATIVE_CASH` rows with outflow amounts only).
- Explicitly deferred:
  - Rich explainability UI and advanced attribution APIs.
  - Multi-step causal narratives beyond rule-to-event mapping.
---

## 11.2) Compatibility Ledger

- `src/20_Writers.gs`:
  - Keeps rename fallback from legacy `Forecast Journal` sheet name to current `Journal`.
  - Remove only after confirming no live sheets still use the legacy tab.
- `src/16_Readers.gs`:
  - Keeps legacy value normalization path for backward compatibility.
  - Remove only after migration confirms all supported datasets use canonical values.

## 12) Schema Demonstration (Canonical)

Canonical schema source is `src/02_Schema.gs` (`Schema.inputs`, `Schema.outputs`).

### Sample input schema shapes

`Accounts`:
- `Account Name` (string, required)
- `Balance` (number, required)
- `Type` (enum: `Cash|Credit`, required)
- `Include` (boolean)
- `Scenario` (scenario, optional, defaults to `Base`)
- `Money In / Month` (number, computed)
- `Money Out / Month` (number, computed)
- `Net Interest / Month` (number, computed)
- `Net Change / Month` (number, computed)
- `Interest Rate (APR %)` (number)
- `Interest Fee / Month` (number)
- `Interest Method` (enum)
- `Interest Frequency` (enum)
- `Interest Repeat Every` (positive_int)
- `Interest Start Date` (date)

`Income`:
- `Include` (boolean, required)
- `Scenario` (scenario, optional, defaults to `Base`)
- `Monthly Total` (number, computed)
- `Type` (income_type, required)
- `Name` (string, required)
- `Amount` (number, required)
- `Frequency` (enum, required)
- `Repeat Every` (positive_int)
- `Start Date` (date, required)
- `End Date` (date)
- `To Account` (ref, required)
- `Notes` (string)

`Expense` and `Transfers` use the same recurrence pattern and include `Scenario` and `Monthly Total`.

`Policies`, `Goals`:
- Include `Scenario` as optional selector for scenario-specific rules.
- Are validated and filtered by scenario before journal build.

### Output schema shape

`Journal` base columns:
- `Date`
- `Scenario`
- `Account`
- `Transaction Type`
- `Name`
- `Amount`
- `Source Rule ID`
- `Alerts`
- Dynamic trailing columns: one per forecast account.

### Runtime schema notes

- `Scenario` is normalized by reader logic; blank values resolve to `Base`.
- Setup applies data-validation lists and named ranges based on schema.
- Writers compose final Journal headers from schema + dynamic account columns.

---

## 13) Document and Function Index

### Document library

- `README.md`: project overview and top-level doc index.
- `docs/SOURCE_STRUCTURE.md`: source layout and ownership map.
- `docs/CLASP.md`: setup/sync paths (manual Apps Script copy or clasp).
- `docs/CODEX.md`: local Codex development configuration notes.
- `docs/SCENARIOS.md`: scenario setup/runtime integration notes.
- `docs/TEST_CASES.md`: manual regression test scenarios.
- `docs/TECHNICAL.md`: full functional and behavior reference (this file).

### Function index (entrypoints and core modules)

Menu/UI entrypoints (`src/30_Menu.gs`):
- `onOpen`
- `runForecast`
- `runJournal`
- `showRunBudgetDialog`
- `runBudgetSelections`
- `runAccountSummariesOnly_`
- `summariseAccounts`
- `showSetupDialog`
- `runSetupActions`
- `runDeterministicFixtureTestsPhase2_All`
- `runDeterministicFixtureTestsPhase2_RunAllWithReport`
- `runDeterministicFixtureTestsPhase2_FixtureA`
- `runDeterministicFixtureTestsPhase2_FixtureB`
- `runDeterministicFixtureTestsPhase2_FixtureC`
- `runDeterministicFixtureTestsPhase2_FixtureD`
- `runDeterministicFixtureTestsPhase2_FixtureE`
- `runDeterministicFixtureTestsPhase2_FixtureF`
- `runDeterministicFixtureTestsPhase2_FixtureG`

Export entrypoints (`src/42_Export.gs`):
- `showExportDialog`
- `runExportWithSelection`

Summary entrypoints (`src/21_Summary.gs`):
- `runSummary`
- `runSummaryForScenario`

Core module APIs:
- `Engine.runForecast`, `Engine.runForecastForScenario`, `Engine.runJournalOnly`, `Engine.runJournalForScenario` (`src/19_Engine.gs`)
- `Readers.readAccounts`, `Readers.readIncome`, `Readers.readExpenses`, `Readers.readTransfers`, `Readers.readPolicies`, `Readers.readGoals`, `Readers.readScenarios` (`src/16_Readers.gs`)
- `Writers.writeJournal` (`src/20_Writers.gs`)
- `Recurrence.expand`, `Recurrence.stepForward`, `Recurrence.periodsPerYear` (`src/10_Recurrence.gs`)

