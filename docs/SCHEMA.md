# Sheet Schemas

Generated from `src/02_Schema.gs`.

## Inputs

### `Accounts`

| Column | Type | Required | Description |
|-----|-----|---------|------------|
| Account Name | string | Yes | Unique identifier |
| Balance | number | Yes | Starting balance |
| Type | enum | Yes | Cash / Credit |
| Forecast | boolean | Optional | Include running balance in Journal |

---

### `Income`

| Column | Type | Required | Description |
|-----|-----|---------|------------|
| Active | boolean | Yes | Include in forecast |
| Name | string | Yes | Label |
| Amount | number | Yes | > 0 |
| Frequency | enum | Yes | Recurrence |
| Start Date | date | Yes | First occurrence |
| End Date | date | Optional | Optional stop date |
| Paid To | ref | Yes | Destination account |
| Notes | string | Optional | Optional |

---

### `Expense`

| Column | Type | Required | Description |
|-----|-----|---------|------------|
| Active | boolean | Yes | Include in forecast |
| Behavior | enum | Yes | Scheduled / Planned / Internal Transfer / One-time / Budget Limit (no spend) |
| Category | category | Optional | Reporting |
| Name | string | Yes | Label |
| Amount | number | Yes | >= 0 |
| Frequency | enum | Optional | Required unless CapOnly / OneOff |
| Start Date | date | Optional | Required for Scheduled / Planned / One-time |
| End Date | date | Optional | Optional stop date |
| Paid From | ref | Optional | Required unless CapOnly |
| Paid To | ref_or_external | Optional | Required for Scheduled / Provision |
| Notes | string | Optional | Optional |

---

## Outputs

### Forecast Journal

| Column | Type | Required | Description |
|-----|-----|---------|------------|
| Date | date | Yes | Event date |
| Date | date | Yes | Event date |
| Account | string | Optional | Debited/credited account |
| Type | enum | Yes | Income / Expense / Transfer |
| Name | string | Yes | Label |
| Amount | number | Yes | Event amount |
| Behavior | enum | Yes | Behavior |

Additional columns:
- One column per Account with Forecast checked (running balance per row)

---

### Daily Summary

| Column | Type | Required | Description |
|-----|-----|---------|------------|
| Date | date | Yes | Day |
| Total Cash | number | Yes | Sum of cash balances |
| Total Debt | number | Yes | Sum of credit balances |
| Net Position | number | Yes | Cash minus debt |

Additional columns:
- One column per Account with Forecast checked (daily balance)

---

### Overview

| Column | Type | Required | Description |
|-----|-----|---------|------------|
| Metric | string | Yes | Label |
| Value | string | Yes | Value |

Additional columns:
- One column per Account with Forecast checked (used in Forecast Balances section)

---

### Logs

| Column | Type | Required | Description |
|-----|-----|---------|------------|
| Timestamp | date | Yes | Logged time |
| Level | string | Yes | INFO / WARN / ERROR |
| Message | string | Yes | Log message |
