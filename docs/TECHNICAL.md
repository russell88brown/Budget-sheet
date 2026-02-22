Subject: Budget Forecast Engine Full Technical Reference

# Technical Reference

This document is the implementation reference for the Budget Forecast Engine (Google Apps Script), covering functionality, behavior, and current use cases.

---

## 1) Architecture

Two layers:

1. **Google Sheets workbook** (state + inputs + outputs)
2. **Apps Script runtime** (forecast engine + writers + formatters)

The workbook is the source of truth. Outputs are deterministically regenerated on each run; there is no hidden state in code.

### Current program of work

- Week 1 (completed): extract domain core for event compile/apply, keep behavior unchanged, add deterministic fixture runners.
- Week 2 (in progress): add stable rule traceability (`Rule ID` -> `Source Rule ID`) while keeping explainability intentionally minimal.
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

#### Risk
- Columns: Include, Scenario, Rule ID, Scenario Name, Emergency Buffer Account, Emergency Buffer Minimum, Income Shock Percent, Expense Shock Percent, Notes
- Emergency buffer settings are used by auto deficit cover to keep a minimum balance.

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
- `Readers.readAccounts()` ([src/10_Readers.gs](../src/10_Readers.gs))
- `Readers.readIncome()` ([src/10_Readers.gs](../src/10_Readers.gs))
- `Readers.readExpenses()` ([src/10_Readers.gs](../src/10_Readers.gs))
- `Readers.readTransfers()` ([src/10_Readers.gs](../src/10_Readers.gs))
- `Readers.readPolicies()` ([src/10_Readers.gs](../src/10_Readers.gs))
- `Readers.readGoals()` ([src/10_Readers.gs](../src/10_Readers.gs))
- `Readers.readRiskSettings()` ([src/10_Readers.gs](../src/10_Readers.gs))

### c) Refresh account summaries (optional)
- `refreshAccountSummaries_()` ([src/40_Engine.gs](../src/40_Engine.gs)) updates monthly averages on the Accounts sheet.

### d) Generate events
- Income rules -> income events
- Expense rules -> expense events
- Transfer rules -> transfer events
- Interest rules -> interest events
  (Implementation: [src/20_Events.gs](../src/20_Events.gs))

### e) Build journal
- `CoreCompileRules` + `CoreApplyEvents` apply events in chronological order and produce running balances.
- Interest accrues daily per account and posts in bulk on configured posting dates.
- Repayment transfers are capped to the remaining credit balance.
- If a credit balance is already >= 0, repayment transfers are skipped once per name.
- `Transfer - Everything Except` keeps the specified amount in the source account and moves any excess.
- Auto deficit cover policies insert transfers to prevent cash accounts from dropping below a threshold.
- Emergency buffer settings can reserve a minimum balance from deficit coverage.
- Journal rows carry `Source Rule ID` for rule-level traceability.

### f) Write outputs
- `Writers.writeJournal()` ([src/50_Writers.gs](../src/50_Writers.gs)) writes the Journal and applies formatting/filters.
- Summary pipeline (from Journal):
  - `buildDailySummary_()` ([src/60_Summary.gs](../src/60_Summary.gs))
  - `writeDailySummary_()` ([src/60_Summary.gs](../src/60_Summary.gs))
  - `buildMonthlySummary_()` ([src/60_Summary.gs](../src/60_Summary.gs))
  - `writeMonthlySummary_()` ([src/60_Summary.gs](../src/60_Summary.gs))
  - `buildDashboardData_()` ([src/60_Summary.gs](../src/60_Summary.gs))
  - `writeDashboard_()` ([src/60_Summary.gs](../src/60_Summary.gs))

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

Accounts -> Income -> Transfers -> Expense -> Journal -> Daily -> Monthly -> Dashboard -> Export -> Settings

### Daily formatting
- Date column formatted as `yyyy-mm-dd`
- Conditional formatting applies only to account balance columns

### Journal formatting
- Frozen header row
- Filters applied to the header row
- Conditional formatting:
  - Credit accounts: green if >= 0
  - Cash accounts: red if < 0
  - Alerts: dark red font when `NEGATIVE_CASH`

---

## 7) Export Behavior

- Export dialog allows selecting which core sheets to export.
- Output is written into the **Export** sheet.
- Format is compact TSV (tab-separated), one row per sheet or per Journal month.
- Output is chunked if a cell exceeds length limits.

---

## 8) Menu-Level Functionality

Available user actions from **Budget Forecast** menu:
- Run journal
- Run summaries
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

Main modules:
- [`00_Config.gs`](../src/00_Config.gs) (constants + names)
- [`01_Menu.gs`](../src/01_Menu.gs) (menu wiring + setup dialog)
- [`02_Schema.gs`](../src/02_Schema.gs) (schema definitions)
- [`05_Setup.gs`](../src/05_Setup.gs) (sheet creation + validation)
- [`06_DefaultData.gs`](../src/06_DefaultData.gs) (default seed data)
- [`07_Export.gs`](../src/07_Export.gs) (export routines)
- [`10_Readers.gs`](../src/10_Readers.gs) (input parsing)
- [`20_Events.gs`](../src/20_Events.gs) (event generation)
- [`30_Recurrence.gs`](../src/30_Recurrence.gs) (date stepping)
- [`40_Engine.gs`](../src/40_Engine.gs) (forecast pipeline)
- [`50_Writers.gs`](../src/50_Writers.gs) (journal writer)
- [`60_Summary.gs`](../src/60_Summary.gs) (daily/monthly/dashboard)

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
- Explicitly deferred:
  - Rich explainability UI and advanced attribution APIs.
  - Multi-step causal narratives beyond rule-to-event mapping.
---

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

`Policies`, `Goals`, `Risk`:
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
- `docs/CLASP.md`: setup/sync paths (manual Apps Script copy or clasp).
- `docs/CODEX.md`: local Codex development configuration notes.
- `docs/SCENARIOS.md`: scenario setup/runtime integration notes.
- `docs/TEST_CASES.md`: manual regression test scenarios.
- `docs/TECHNICAL.md`: full functional and behavior reference (this file).

### Function index (entrypoints and core modules)

Menu/UI entrypoints (`src/01_Menu.gs`):
- `onOpen`
- `runForecast`
- `runJournal`
- `runJournalForScenarioPrompt`
- `runSummaryForScenarioPrompt`
- `runScenarioAction`
- `summariseAccounts`
- `showSetupDialog`
- `runSetupActions`

Export entrypoints (`src/07_Export.gs`):
- `showExportDialog`
- `runExportWithSelection`
- `exportAllSheetsToJson`

Summary entrypoints (`src/60_Summary.gs`):
- `runSummary`
- `runSummaryForScenario`

Core module APIs:
- `Engine.runForecast`, `Engine.runForecastForScenario`, `Engine.runJournalOnly`, `Engine.runJournalForScenario` (`src/40_Engine.gs`)
- `Readers.readAccounts`, `Readers.readIncome`, `Readers.readExpenses`, `Readers.readTransfers`, `Readers.readPolicies`, `Readers.readGoals`, `Readers.readRiskSettings`, `Readers.readScenarios` (`src/10_Readers.gs`)
- `Writers.writeJournal` (`src/50_Writers.gs`)
- `Recurrence.expand`, `Recurrence.stepForward`, `Recurrence.periodsPerYear` (`src/30_Recurrence.gs`)
