# Budget Forecast Engine

✨ Welcome! This is a fun, forward-looking budget planner that runs **inside Google Sheets**. You define your rules today, and it projects where your balances are heading tomorrow.

## ✅ What this is
- A **forecast** of future balances (cash + debt)
- A **planner** you can rerun anytime as life changes

## ❌ What this is not
- Not a full accounting system
- Not a transaction tracker for the past

---

## 🚀 Quick Start (3 minutes)

### 1) Run Setup
Use **Budget Forecast → Setup actions...** to create or refresh all sheets.

Setup will:
- 🧱 Rebuild **header rows**
- ✅ Restore **dropdowns + checkboxes**
- 🧭 Recreate **Settings** ranges

### 2) Fill in your inputs
- **Accounts**: current balances
- **Income**: money coming in
- **Expense**: money going out to external payees
- **Transfers**: money moved between accounts (including repayments)

### 3) Run the forecast
Use **Budget Forecast → Run journal** to build the **Journal**.

### 4) Generate summaries
Use **Budget Forecast → Run summaries** to create:
- **Daily** (day-by-day balances)
- **Monthly** (monthly stats)
- **Dashboard** (visual overview)

### 5) Export
Use **Budget Forecast → Export** to export selected sheets into **Export**.

---

## 🧰 Menu Actions (Functions You Can Run)

### ✅ Budget Forecast → Run journal
Builds the **Journal** by applying all income + expense + transfer rules in order.

### 📊 Budget Forecast → Run summaries
Creates:
- **Daily** (cash, debt, net position, account snapshots)
- **Monthly** (min/max/change/ending per account)
- **Dashboard** (charts + healthcheck + account blocks)

### 📦 Budget Forecast → Export
Creates a compact export in the **Export** sheet. Data is stored as lightweight TSV per row (easy to copy or parse).

### 🧮 Budget Forecast → Summarise Accounts
Refreshes account-level monthly summaries used by the engine.

### 🧩 Budget Forecast → Setup actions...
Opens a setup dialog with these actions:
- **Structure** (sheets + headers)
- **Validation + settings** (ranges + categories)
- **Theme** (color + bold formatting)
- **Load default data** (if inputs are empty)

---

## 📄 Sheet Overview

### Inputs (you edit these)
- **Accounts**
- **Income**
- **Expense**
- **Transfers**
- **Policies** (optional auto-deficit cover rules)
- **Goals** (optional savings targets)
- **Risk** (optional scenario buffers)

### Outputs (auto-generated)
- **Journal** (every forecasted event + running balances)
- **Daily** (daily totals + account balances)
- **Monthly** (monthly stats per account)
- **Dashboard** (charts + insights)
- **Logs** (engine logs)

### Other
- **Settings** (helper lists + settings)
- **Export** (compact export output)

---

## 🧪 Settings Sheet (what it does)
The **Settings** sheet contains shared values used by the model:

- **Forecast Start / End** (summary window)
- **Expense Categories** (dropdowns in Expense)

You usually don’t need to edit this manually — **Setup** will recreate it if needed.

---

## 🔁 Keeping it accurate
Whenever real life changes:
1. Update **Accounts** balances
2. Run **Run journal** again
3. (Optional) Run **Run summaries**

That’s it. The model is forward-only and always rebuilds outputs from scratch.

---

## 💡 Tips
- Use **Include** checkboxes to control what gets forecasted.
- Use **Frequency + Repeat Every + Start Date** to schedule recurring items.
- Use **Transfer Type** on `Transfers` to choose repayment/transfer behavior explicitly (`Repayment - Amount`, `Repayment - All`, `Transfer - Amount`, `Transfer - Everything Except`).
- If headers or dropdowns look wrong, just run **Setup** again.

---

## 🧑‍💻 Development (clasp sync)

Prerequisites:
- Node.js LTS + npm
- Access to the target Apps Script project

Setup:
1. Install clasp: `npm install -g @google/clasp`
2. Login: `clasp login`
3. Create local config: `Copy-Item .clasp.example.json .clasp.json`
4. Edit `.clasp.json` and set your `scriptId`

Common commands:
- `clasp pull`
- `clasp push`
- `clasp open`

Detailed setup guide: `docs/CLASP.md`

---

## 🛠 Technical details
See: `docs/TECHNICAL.md`
