# Budget Forecast Engine

Welcome! This is a simple, forward-looking budget planner that runs inside Google Sheets. It helps you see where your balances are heading based on the rules you set today.

## ? What this is
- A **forecast** of future balances (cash + debt)
- A **planner** you can re-run anytime as reality changes

## ?? What this is not
- It is **not** an accounting system
- It does **not** track past transactions

---

## ? Quick Start (3 minutes)

### 1) Set up your sheets
Use **Budget Forecast ? Setup** to create or refresh all input sheets.

Setup does three important things for you:
- ? Rebuilds **header rows** so they match the model
- ? Restores **data validation** (dropdowns, checkboxes)
- ? Recreates **Reference** data ranges if missing

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

## ?? Sheet Overview

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
- **Reference** (helper lists and settings)
- **Export** (your exported data)

---

## ?? Reference data (what it’s for)
The **Reference** sheet holds shared values and settings used by the model:

- **Forecast Start / End**: the date window to build summaries over
- **Expense Category list**: used as dropdown options in Expenses
- **Sink Fund settings**: which accounts are sink funds and how much to set aside per week

The engine also **summarizes a weekly sink fund estimate** into Reference. You can then create an **Expense** row (typically a Provision/Transfer) that uses that weekly amount to fund your sink account.

You usually don’t need to edit Reference manually — running **Setup** will create or repair it if needed.

---

## ?? Sink funds (simple explanation)
Sink funds are just **regular accounts** you use to park money for future spending.

Examples:
- Car Fund
- Holiday Fund
- Emergency Fund

How it works:
- Mark the account as a **Sink Fund** in **Accounts**
- Add a **Provision** or recurring transfer into that account in **Expense**
- The engine **never auto-spends** sink funds — you update the balance when you spend in real life

This keeps the forecast forward-only and honest.

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
- If headers or dropdowns look wrong, **run Setup** to fix them.

---

## ??? Need the technical details?
See: `docs/TECHNICAL.md`
