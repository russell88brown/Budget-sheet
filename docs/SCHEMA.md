# Sheet Schemas

## Inputs

### `Accounts`

| Column | Type | Required | Description |
|-----|-----|---------|------------|
| Account Name | string | Yes | Unique identifier |
| Balance | number | Yes | Starting balance |
| Type | enum | Yes | Cash / Credit |

---

### `Income`

| Column | Type | Required | Description |
|-----|-----|---------|------------|
| Active | boolean | Yes | Include in forecast |
| Name | string | Yes | Label |
| Amount | number | Yes | > 0 |
| Frequency | enum | Yes | Recurrence |
| Anchor Date | date | Yes | First occurrence |
| Paid To | ref(Account) | Yes | Destination account |
| Notes | string | Optional | Optional |

---

### `Expense`

| Column | Type | Required | Description |
|-----|-----|---------|------------|
| Active | boolean | Yes | Include in forecast |
| Behavior | enum | Yes | Scheduled / Provision / CapOnly / OneOff |
| Category | string | Optional | Reporting |
| Name | string | Yes | Label |
| Amount | number | Yes | >= 0 |
| Frequency | enum | Optional | Required unless CapOnly / OneOff |
| Anchor Date | date | Optional | Required for Scheduled / Provision |
| Once Date | date | Optional | Required for OneOff |
| Paid From | ref(Account) | Optional | Required unless CapOnly |
| Paid To | ref(Account or External) | Optional | Required for Scheduled / Provision |
| Notes | string | Optional | Optional |

---

## Outputs

### Forecast Journal
This is the **authoritative audit trail**.

Each row represents a generated event.

Typical columns:
- Date
- Kind (Income / Expense / Transfer)
- Behavior
- Name
- Category
- From
- To
- Amount
- Balance after event (per account)

Purpose:
- explain *why* balances change
- debug unexpected results

---

### Daily Summary
Derived from the journal.

One row per day:
- account balances
- total cash
- total debt
- net position

Used for:
- charts
- overview calculations

---

### Overview
A human-readable summary of the forecast.

Typical sections:
- Opening vs ending balances
- Minimum Holding balance and date
- Bucket balances (reserved cash)
- Debt change
- Net position change
- Monthly provisions
- Discretionary caps

---

### Logs
Generated warnings and diagnostics:
- invalid references
- skipped rows
- negative cash warnings
