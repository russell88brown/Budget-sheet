# Budget Forecast Engine

Budget Forecast Engine turns your Google Sheet into a forward-looking money simulator.

You define how money moves (income, expenses, transfers, policies), then run the menu actions to regenerate:
- `Journal`
- `Daily`
- `Monthly`
- `Dashboard`

## First 5 Clicks (Get Base Running)

1. Open menu `Budget Forecast -> Setup actions...`
2. Select `Structure`, `Validation + settings`, and `Theme`, then click `Run`
3. (Optional) In the same setup dialog, run `Load default data` for a working sample
4. Click `Budget Forecast -> Run Main Scenario...`
5. In popup, tick `Journal` and `Summaries`, then click `Run`

You now have a complete base forecast.

## Configure Scenarios (Simple Path)

1. Go to `Settings` sheet
2. Add or edit scenario names in column `H` (`Base`, `Stress`, etc.)
3. In input sheets (`Accounts`, `Income`, `Expense`, `Transfers`, `Policies`, `Goals`, `Risk`), set each row's `Scenario`
4. Open `Run Custom Scenario(s)...`
5. Tick actions (`Journal`, `Summaries`) and multi-select one or more scenarios
5. Check run history in `Settings!J:N`

## Menu Buttons (Plain English)

- `Run Main Scenario...`:
  - opens popup
  - choose one or both actions with checkboxes (`Journal`, `Summaries`)
  - runs against `Base`
- `Run Custom Scenario(s)...`:
  - opens popup
  - choose one or both actions with checkboxes
  - multi-select scenarios
  - runs selected actions for each selected scenario
- `Summarise Accounts`: recalculates account monthly summary fields.
- `Export`: downloads selected sheets as JSON zip.
- `Setup actions...`: structure, validation/settings, theme, default sample data.

## Scenario Case Studies

| Scenario | User Story | Implementation | Output |
|---|---|---|---|
| Base | "I just want my normal month-to-month plan." | Keep rows blank or set `Scenario=Base`. Run Base journal + summaries. | Standard forecast baseline in Journal/Daily/Monthly/Dashboard. |
| Stress | "What if my income drops and expenses rise?" | Create/enable `Stress` rows for income/expenses/risk assumptions. Run scenario actions for `Stress`. | Alternate downside forecast, comparable against Base. |
| Debt Sprint | "I want to test an aggressive debt payoff plan." | Duplicate transfer/policy rows with `Scenario=Debt Sprint` and higher repayments. | Shows payoff speed, cash pressure, and negative-cash risk under sprint strategy. |
| Job Change | "I may switch jobs in 3 months." | Add new income pattern as `Scenario=Job Change` with updated start date. | Timeline impact on cash runway and account balances. |
| Family Expansion | "We're planning for a new recurring cost stack." | Add new expense rows (`childcare`, etc.) in dedicated scenario. | Clear picture of affordability before committing. |

## Where To Look In Settings

- `A:B`: forecast window and latest run snapshot
- `D`: expense categories
- `F`: income types
- `H`: scenario catalog (`ScenarioList`)
- `J:N`: append-only run log (`Run At`, `Mode`, `Scenario`, `Status`, `Notes`)

## Documentation Map (Deeper Detail)

- `docs/SCENARIOS.md`: scenario setup/runtime behavior
- `docs/TEST_CASES.md`: manual regression test cases
- `docs/TECHNICAL.md`: full technical reference
- `docs/CLASP.md`: Apps Script/clasp setup
- `docs/CODEX.md`: local development notes
