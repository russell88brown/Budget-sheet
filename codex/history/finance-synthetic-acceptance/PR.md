# Finance follow-on synthetic acceptance PR notes

## Summary
Add four synthetic acceptance cases and a test using the existing event-application module. The cases make proposed normalisation and availability requirements visible without implementing them in production.

## Sprint Plan Reference
See [sprint-plan.md](sprint-plan.md) for scope and acceptance.

## Completed Scope
Added one fixture JSON, one typed test and an evidence note. The test follows the repository's assert-based tests/*.test.ts pattern and imports the actual production module through its normal repository path.

## Change Log
Model a duplicate posted card payment, repeated bill reminders, date-gated notice cash and paid travel already represented by the opening balance. Compare complete event projections, reject conflicting duplicate examples and record raw application results separately.

## Test Evidence
The exact candidate test passed on Node 26.8.2 against pinned source 07bfa140e8b2c3aec2fa3e34dc066dc54037a1e1, using native TypeScript stripping and an external local resolver. The resolver is not part of the candidate. The pinned event-application test passed separately. Candidate sprint docs passed the existing sprint checker in a temporary verification tree. Full npm test, typecheck, build and Apps Script tests were not run. See [evidence](../../../docs/finance-follow-on-acceptance.md).

## Follow-Ups
Implement and test production normalisation and availability policy through the complete journal path before claiming domain support. The proposed publication extends existing draft #22 at its verified head without retargeting it; recheck that head before updating. Private workbook deployment remains separate.
