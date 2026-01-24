# Sheet Schemas

Generated from `src/02_Schema.gs`.

## Inputs

### `Accounts`

| Column | Type | Required | Description |
|-----|-----|---------|------------|
| Account Name | string | Yes | Unique identifier |
| Balance | number | Yes | Starting balance |
| Type | enum | Yes | Cash / Credit |
| Include | boolean | Optional | Include in forecast outputs |
| Sink Fund | boolean | Optional | Mark as sinking fund |

---

### `Income`

| Column | Type | Required | Description |
|-----|-----|---------|------------|
| Include | boolean | Yes | Include in forecast |
| Name | string | Yes | Label |
| Amount | number | Yes | > 0 |
| Frequency | enum | Yes | Recurrence |
| Start Date | date | Yes | First occurrence |
| End Date | date | Optional | Optional stop date |
| To Account | ref | Yes | Destination account |
| Notes | string | Optional | Optional |

---

### `Expense`

| Column | Type | Required | Description |
|-----|-----|---------|------------|
| Include | boolean | Yes | Include in forecast |
| Transaction Type | enum | Yes | Expense / Repayment / Transfer |
| Category | category | Optional | Reporting |
| Name | string | Yes | Label |
| Amount | number | Yes | >= 0 |
| Frequency | enum | Optional | Recurrence |
| Start Date | date | Optional | First occurrence |
| End Date | date | Optional | Optional stop date |
| From Account | ref | Optional | Source account |
| To Account | ref_or_external_conditional | Optional | Destination account or External |
| Notes | string | Optional | Optional |

---

## Outputs

### Forecast Journal

| Column | Type | Required | Description |
|-----|-----|---------|------------|
| Date | date | Yes | Event date |
| Date | date | Yes | Event date |
| Account | string | Optional | Debited/credited account |
| Transaction Type | enum | Yes | Income / Expense / Transfer |
| Name | string | Yes | Label |
| Amount | number | Yes | Event amount |
| Behavior | enum | Yes | Income / Expense / Repayment / Transfer |

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
