# Budget Forecast Engine

Welcome! This is a simple, forward-looking budget planner that runs inside Google Sheets. It helps you see where your balances are heading based on the rules you set today.

## ? What this is
- A **forecast** of future balances (cash + debt)
- A **planner** you can re-run anytime as reality changes

## ?? What this is not
- It is **not** an accounting system
- It does **not** track past transactions

---

## ?? Quick Start (3 minutes)

### 1) Set up your sheets
Use the **Budget Forecast ? Setup** menu to create or refresh the input sheets.

### 2) Fill in your inputs
- **Accounts**: your current balances
- **Income**: money coming in
- **Expense**: money going out or transfers

### 3) Run the forecast
Use **Budget Forecast ? Run forecast** to generate the Journal.

### 4) View summaries
Use **Budget Forecast ? Run summary** to generate **Daily** and **Monthly** summaries.

### 5) Export
Use **Budget Forecast ? Export** to send selected sheets to the Export tab.

---

## ??? Sheet Overview

### Inputs (you edit these)
- **Accounts**
- **Income**
- **Expense**

### Outputs (auto-generated)
- **Journal** (every forecasted event)
- **Daily** (daily balances)
- **Monthly** (monthly stats)
- **Logs** (engine logs)

### Other
- **Reference** (helper lists)
- **Export** (your exported data)

---

## ?? How to keep it accurate
Whenever real life changes:
1. Update **Accounts** balances
2. Run **Run forecast** again
3. (Optional) Run **Run summary**

That’s it. The model is forward-only and always rebuilds outputs from scratch.

---

## ?? Tips
- Use **Include** checkboxes to control what’s forecasted.
- Use **Frequency** + **Start Date** to define recurring items.
- Use **One-off** for single future payments.

---

## ??? Need the technical details?
See: `docs/TECHNICAL.md`
