# Budget Forecast Engine - Docs

## Purpose and Scope

This application is a **forward-looking budget and cash-flow forecasting engine**.

It is designed to:
- forecast future balances based on known rules
- model cash pressure, debt trajectories, and reserved funds
- be rerun frequently as reality changes

It is **not** designed to:
- track historical transactions
- reconcile planned vs actuals
- serve as an accounting system

If something has already happened in real life, the user updates **starting balances** and reruns the forecast.

---

## High-level Architecture

The system consists of two parts:

1. **Spreadsheet (data + outputs)**
2. **Forecast engine (Apps Script code)**

The spreadsheet defines **state and rules**.  
The code reads those rules, generates events, applies them to balances, and writes outputs.

There is **no hidden state** in the code.

---

## Spreadsheet Structure

This is a **single workbook** with clearly separated concerns.

### Budget sheet

```
Spreadsheet
|- Inputs
| |- Accounts
| |- Income
| |- Expense
|
|- Outputs (generated)
| |- Journal
| `- Logs
```

Users **only edit the Inputs**.  
Outputs are regenerated and overwritten on every run.

---

## Documentation Map

- Conceptual model: `docs/MODEL.md`
- Sheet schemas and output tables: `docs/SCHEMA.md`

---

## Source Structure (Apps Script)

```
src/
|- 00_Config.gs
|- 01_Menu.gs
|- 10_Readers.gs
|- 20_Events.gs
|- 30_Recurrence.gs
|- 40_Engine.gs
|- 50_Writers.gs
|- 90_Utils.gs
`- 99_Logger.gs
```

Each file owns a **single responsibility**. The numbering enforces a stable load order.
