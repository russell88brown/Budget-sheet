# Documentation Index

## App Documentation

| Document | Purpose |
|---|---|
| `TECHNICAL.md` | Detailed architecture and runtime responsibilities. |

## Tooling / Contributor Documentation

| Document | Purpose |
|---|---|
| `tooling/CI.md` | CI and PR automation workflows/secrets. |
| `tooling/CLASP.md` | Apps Script sync setup (`clasp`). |
| `tooling/CODEX.md` | Local Codex contributor setup plus sprint planning/execution/review workflow. |
| `tooling/clasp.json` | Local docs copy of clasp config template for tooling examples. |
| `.clasp.example.json` | Root-level clasp template for local setup. |

## Personal finance workbook map

The Google Drive **Finances** folder holds the **CommBank Transaction Ledger** for recorded transactions. The Budget App workbook models future movements. A projected payment becomes evidence of an actual payment only when it can be matched to a posted transaction. [Storage and source ownership](https://github.com/russell88brown/personal-governance/issues/51).

| Information | Where it belongs | How a contributor uses it |
| --- | --- | --- |
| Posted transactions and their supporting records | Private ledger and original source documents | Reconcile a posted credit or debit once. Record its effective date when checking the forecast. |
| Opening balances | Private forecast workbook, `Accounts` | Identify the account and record the balance as of the forecast start. Keep notice periods and release dates available when estimating spendable cash. |
| Wages and reimbursements | `Income` | Give each stream its own rule with amount, dates, frequency and destination. Identify provisional reimbursements in the scenario. |
| Bills, rent and trip spending | `Expense` | Model due dates and the paying account. Distinguish costs already reflected in opening balances from future costs. |
| Internal moves and card repayments | `Transfers` | Identify the source and destination accounts. A principal repayment reduces both cash and debt. |
| Scenario parameters | Private workbook rules, `Policies`, `Goals` and run tags | Russell maintains personal assumptions. Keep reusable definitions of rule types, defaults and schema in this repository. |
| Generated outputs | `Journal`, then `Daily`, `Monthly` and `Dashboard` | Review the events first. Daily and monthly summaries show total cash, total debt and net position. An available-cash view requires a separate definition of when each balance can be spent. |

### Access and change ownership

Russell controls access to the private Drive files. The workbook headers were observed on 28 November 2026. [The technical reference](TECHNICAL.md) describes the source implementation. The deployed Apps Script revision and any connection to Budget Web remain unverified.

Use a branch and PR here for reusable finance code, schema, rule defaults and synthetic fixtures. The reference lists the configuration and schema modules under section B and deterministic fixture tests under section Z. Invent all sample accounts, amounts and dates. A live workbook row with an account balance or recurrence amount is personal data even when the engine reads it as a rule. Keep statements, workbook exports, provider IDs and actual amounts in the private finance sources. Personal Governance holds the cross-repository index, access decisions and proposed storage changes. A future migration is tracked in the linked governance issue.

### Proposed follow-on PRs

| Assignment | Deliverable and acceptance example |
| --- | --- |
| Card and instalment reconciliation | Model statement amounts, pending transfers, posted credits and due dates. Replaying a posted credit leaves the amount owing unchanged. |
| Bills | Define a private bills register and a synthetic reminder example. A second reminder for the same bill produces one obligation. |
| Accessible cash | Forecast by date using confirmed and provisional inflows, payment dates and savings release dates. A notice account contributes to spendable cash only on its available date. Use the card and bills outputs as obligations. |
| Travel costs | Track quoted, committed and paid costs. A paid booking included in the opening position contributes zero to remaining costs. Compare the unpaid schedule with accessible cash. |
