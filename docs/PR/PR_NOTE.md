# PR Note: TypeScript Migration Foundation

## Summary
- Introduces TypeScript migration foundation with low-risk adapter wiring.
- Keeps Apps Script runtime stable with typed-first + JS fallback behavior.
- Adds typed recurrence utilities and tests in this continuation slice.

## Implemented
- TS build/test foundation (`tsconfig`, scripts, typed modules, tests).
- Typed adapters in `src/B07_TypedAdapters.gs`.
- Typed runtime baseline file: `src/B08_TypedBudget.generated.gs`.
- Runtime wiring for:
  - run action/tag selection
  - date helpers
  - event sort
  - compiled event normalize/compare
  - recurrence helpers (`B04` now routes through typed adapters)

## Local Validation Steps
1. `npm install`
2. `npm run verify`
3. Confirm generated bundle updated if needed:
   - `src/B08_TypedBudget.generated.gs`

## Notes
- Legacy `Scenario` compatibility remains intentionally supported while UI is tag-first.
