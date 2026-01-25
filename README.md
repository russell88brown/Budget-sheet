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
Use **Budget Forecast → Setup…** to create or refresh all sheets.

Setup will:
- 🧱 Rebuild **header rows**
- ✅ Restore **dropdowns + checkboxes**
- 🧭 Recreate **Reference** ranges

### 2) Fill in your inputs
- **Accounts**: current balances
- **Income**: money coming in
- **Expense**: money going out (or transfers)

### 3) Run the forecast
Use **Budget Forecast → Run forecast** to build the **Journal**.

### 4) Generate summaries
Use **Budget Forecast → Run summary** to create:
- **Daily** (day-by-day balances)
- **Monthly** (monthly stats)
- **Dashboard** (visual overview)

### 5) Export
Use **Budget Forecast → Export** to export selected sheets into **Export**.

---

## 🧰 Menu Actions (Functions You Can Run)

### ✅ Budget Forecast → Run forecast
Builds the **Journal** by applying all income + expense rules in order.

### 📊 Budget Forecast → Run summary
Creates:
- **Daily** (cash, debt, net position, account snapshots)
- **Monthly** (min/max/change/ending per account)
- **Dashboard** (charts + healthcheck + account blocks)

### 📦 Budget Forecast → Export
Creates a compact export in the **Export** sheet. Data is stored as lightweight TSV per row (easy to copy or parse).

### 🧩 Budget Forecast → Setup…
Opens a setup dialog with these actions:
- **Setup** (rebuild headers + validation)
- **Load default data**
- **Clear logs**

---

## 📄 Sheet Overview

### Inputs (you edit these)
- **Accounts**
- **Income**
- **Expense**

### Outputs (auto-generated)
- **Journal** (every forecasted event + running balances)
- **Daily** (daily totals + account balances)
- **Monthly** (monthly stats per account)
- **Dashboard** (charts + insights)
- **Logs** (engine logs)

### Other
- **Reference** (helper lists + settings)
- **Export** (compact export output)

---

## 🧪 Reference Sheet (what it does)
The **Reference** sheet contains shared values used by the model:

- **Forecast Start / End** (summary window)
- **Expense Categories** (dropdowns in Expense)
- **Sink Fund settings** (weekly estimate)

The model will **populate sink funds marked in Accounts** and **calculate sink fund totals automatically** (weekly estimate).

You usually don’t need to edit this manually — **Setup** will recreate it if needed.

---

## 🪙 Sink Funds (simple version)
Sink funds are just regular accounts you park money in for future spending.

Examples:
- Car Fund
- Holiday Fund
- Emergency Fund

How it works:
- Mark an account as **Sink Fund** in **Accounts**
- Add a recurring transfer into that account in **Expense**
- The engine never auto-spends sink funds — it just forecasts balances

---

## 🔁 Keeping it accurate
Whenever real life changes:
1. Update **Accounts** balances
2. Run **Run forecast** again
3. (Optional) Run **Run summary**

That’s it. The model is forward-only and always rebuilds outputs from scratch.

---

## 💡 Tips
- Use **Include** checkboxes to control what gets forecasted.
- Use **Frequency + Start Date** to schedule recurring items.
- Use **One-off** for single future payments.
- Repayments with **Amount = 0** are treated as **“pay off the full balance”** at that time (only if the balance is negative).
- If headers or dropdowns look wrong, just run **Setup** again.

---

## 🛠 Want the technical details?
See: `docs/TECHNICAL.md`
