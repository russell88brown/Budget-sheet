# Sheet Schemas

Generated from `src/02_Schema.gs`.

## Inputs

### `Accounts`

| Column |
|-----|
| Account Name |
| Balance |
| Type |

---

### `Income`

| Column |
|-----|
| Active |
| Name |
| Amount |
| Frequency |
| Anchor Date |
| Paid To |
| Notes |

---

### `Expense`

| Column |
|-----|
| Active |
| Behavior |
| Category |
| Name |
| Amount |
| Frequency |
| Anchor Date |
| Once Date |
| Paid From |
| Paid To |
| Notes |

---

## Outputs

### Forecast Journal

| Column |
|-----|
| Date |
| Kind |
| Behavior |
| Name |
| Category |
| From |
| To |
| Amount |

---

### Daily Summary

| Column |
|-----|
| Date |
| Total Cash |
| Total Debt |
| Net Position |

---

### Overview

| Column |
|-----|
| Metric |
| Value |

---

### Logs

| Column |
|-----|
| Timestamp |
| Level |
| Message |
