# PR Note: TypeScript Migration Foundation

## Summary
- Introduces TypeScript migration foundation with low-risk adapter wiring.
- Keeps Apps Script runtime stable with typed-first + JS fallback behavior.
- Adds typed recurrence, reader-normalization, event-builder, apply-calculation, policy-rule, tag-scope, summary-stats, summary-explainability, monthly-recurrence, transfer-monthly-total, and account-summary utilities with tests.

## Implemented
- TS build/test foundation (`tsconfig`, scripts, typed modules, tests).
- Typed adapters in `src/B07_TypedAdapters.gs`.
- Typed runtime baseline file: `src/B08_TypedBudget.generated.gs`.
- Runtime wiring for:
  - run action/tag selection
  - date helpers
  - event sort
  - compiled event normalize/compare
  - recurrence helpers (`B04` routes through typed adapters)
  - reader normalization helpers (`C01` routes through typed adapters)
  - event builders (`D01` routes through typed adapters)
  - transfer resolution + fee helpers (`D03` routes through typed adapters)
  - policy applicability helpers (`D03` routes through typed adapters)
  - tag-scope filtering/set helpers (`D04`/`E01` route through typed adapters)
  - summary math helpers (`E01` routes through typed adapters)
  - negative-cash explainability aggregation (`E01` routes through typed adapters)
  - monthly recurrence factor/recurring checks (`D04` routes through typed adapters)
  - transfer monthly-total decision/resolution helpers (`D04` routes through typed adapters)
  - account-summary normalization/indexing/interest helpers (`D04` routes through typed adapters)

## Local Validation Steps
1. `npm install`
2. `npm run verify`
3. Confirm generated bundle updated if needed:
   - `src/B08_TypedBudget.generated.gs`

## Notes
- Legacy `Scenario` compatibility remains intentionally supported while UI is tag-first.
