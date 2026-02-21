# Technical Reference

This document describes the internal implementation and data model for the Budget Forecast Engine (Google Apps Script).

---

## 1) Architecture

Two layers:

1. **Google Sheets workbook** (state + inputs + outputs)
2. **Apps Script runtime** (forecast engine + writers + formatters)

The workbook is the source of truth. Outputs are deterministically regenerated on each run; there is no hidden state in code.

---

## 2) Sheet Model

### Inputs

#### Accounts
- Columns: Account Name, Balance, Type, Include, Expense Avg / Month, Income Avg / Month, Net Cash Flow / Month, Interest Rate (APR %), Interest Fee / Month, Interest Method, Interest Frequency, Interest Repeat Every, Interest Start Date, Interest End Date
- Type: enum { Cash, Credit }
- Include: boolean, controls whether account appears in forecast outputs

#### Income
- Columns: Include, Name, Amount, Frequency, Repeat Every, Start Date, End Date, To Account, Notes
- Include: boolean, if false rule is ignored
- Frequency: enum (Daily, Monthly, Yearly)

#### Expense
- Columns: Include, Category, Name, Amount, Frequency, Repeat Every, Start Date, End Date, From Account, Notes, Monthly Average

#### Transfers
- Columns: Include, Transfer Type, Name, Amount, Frequency, Repeat Every, Start Date, End Date, From Account, To Account, Notes
- Transfer Type: enum { Repayment - Amount, Repayment - All, Transfer - Amount, Transfer - Everything Except }

#### Policies
- Columns: Include, Policy Type, Name, Priority, Start Date, End Date, Trigger Account, Funding Account, Threshold, Max Per Event, Notes
- Policy Type: enum { Auto Deficit Cover }
- Used to inject transfers that cover cash deficits before an event posts.

#### Goals
- Columns: Include, Goal Name, Target Amount, Target Date, Priority, Funding Account, Funding Policy, Amount Per Month, Percent Of Inflow, Notes
- Goals are validated and read, but not yet applied in the forecast output.

#### Risk
- Columns: Include, Scenario Name, Emergency Buffer Account, Emergency Buffer Minimum, Income Shock Percent, Expense Shock Percent, Notes
- Emergency buffer settings are used by auto deficit cover to keep a minimum balance.

### Outputs

#### Journal
- Each row is a forecasted event, plus running balances for each forecast account.
- Column shape:
  - Date
  - Account
  - Transaction Type
  - Name
  - Amount
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

#### Logs
- Timestamped engine logs (INFO / WARN / ERROR).

---

## 3) Forecast Pipeline

### a) Preprocess + validate inputs
- Normalize rows and recurrence fields.
- Validate each input sheet; invalid rows are deactivated and logged.
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
- Income rules → income events
- Expense rules → expense events
- Transfer rules → transfer events
- Interest rules → interest events
  (Implementation: [src/20_Events.gs](../src/20_Events.gs))

### e) Build journal
- `buildJournalRows_()` ([src/40_Engine.gs](../src/40_Engine.gs)) applies events in chronological order and produces running balances.
- Interest accrues daily per account and posts in bulk on configured posting dates.
- Repayment transfers are capped to the remaining credit balance.
- If a credit balance is already >= 0, repayment transfers are skipped and logged once per name.
- `Transfer - Everything Except` keeps the specified amount in the source account and moves any excess.
- Auto deficit cover policies insert transfers to prevent cash accounts from dropping below a threshold.
- Emergency buffer settings can reserve a minimum balance from deficit coverage.

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

Accounts → Income → Transfers → Expense → Journal → Daily → Monthly → Dashboard → Export → Settings → Logs

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

## 8) Source Map

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
- [`99_Logger.gs`](../src/99_Logger.gs) (structured logging)

---

## 9) Determinism + State

- Outputs are fully reproducible.
- Inputs are the only state.
- Rerunning forecast always regenerates Journal and downstream summaries.
