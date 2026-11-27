# Finance follow-on synthetic acceptance

## Metadata
Owning repository: Budget-sheet. Prepared against PR #22 revision 07bfa140e8b2c3aec2fa3e34dc066dc54037a1e1. The integration publication proposal adds this bounded test package to its existing sprint/finance-workbook-map branch and retains its main target. No branch was updated or deployment performed in preparation.

## Objective
Make the four proposed finance follow-ons testable with invented fixtures and expose the boundary between domain requirements and current event application.

## Scope In
Duplicate posted card payment credit, repeated bill reminder, notice-account availability, and a paid booking represented in opening cash. Add fixtures, a test using the existing typed module and a concise evidence record.

## Task Checklist
- Inspect the pinned contracts, schema, source module and existing test style.
- Create synthetic records with expected canonical BudgetEvent projections.
- Compare full event projections and resulting balances with independent expected values.
- Demonstrate raw duplicate/double-deduction behaviour without changing the engine.
- Record availability as a proposed oracle and retain full-engine acceptance as pending.

## Acceptance Criteria
The repository test runner can discover the new test. All four fixtures have observable assertions, and no passing result is described as an implemented reconciliation or availability feature. No private data or live APIs are used.

## Definition Of Done
The exact candidate test executes offline against the pinned source; sprint documentation passes the existing checker; evidence distinguishes that run from the full suite, deployed workbook and proposed feature implementation.
