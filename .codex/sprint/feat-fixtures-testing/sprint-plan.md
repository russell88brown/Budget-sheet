# Sprint Plan: <sprint-id>

## Metadata
- Sprint ID: TODO
- Start date (YYYY-MM-DD): TODO
- End date (YYYY-MM-DD): TODO
- Owner: TODO
- Branch: `sprint/<sprint-id>`

## Objective
Yep — looking at what’s actually in feat/typescript-migration-continuation, you’ve already got unit tests for a few core functions, and your typed API exposes the exact primitives that fixtures should lock down.

While you’re mid-migration, the most valuable fixtures are the ones that:

pin down ordering + tie-breaks

pin down money movement edge cases (transfers, repay caps, skip rules)

pin down date/recurrence boundaries

pin down policy selection + injection preconditions

pin down normalization compatibility (the #1 place migrations drift)

Here are 10 fixtures I’d implement, in priority order, all grounded in the code on that branch.

1) Sort order “golden list” fixture

Covers: the canonical event ordering (Income → Transfers → Expense → InterestAccrual → Interest → TransferEverythingExcept).
Why: this is the backbone of deterministic simulation.
Use: getEventSortOrder, getEventSortKey, eventSortPriority.
Assert:

getEventSortOrder(config) equals the expected array of keys (exact string list).

For a representative set of events, eventSortPriority ranks them exactly in that order.

2) Same-day tie-break fixture for compiled events

Covers: deterministic ordering when dates + priorities match (sourceRuleId → name → id).
Use: normalizeCompiledEvent, compareCompiledEvents.
Assert:

Given 5 events on same date, same priority, different sourceRuleId/name/id, sorting with compareCompiledEvents yields an exact expected order.

Default id generation (evt_<index>) happens when id missing.

3) Transfer resolution matrix fixture (skip/cap/creditPaidOff)

Covers: repay all / repay amount / everything-except behavior + skip rules + capping.
Use: resolveTransferAmount, estimateTransferOutgoingAmount.
Assert (sequence):

RepaymentAmount caps to remaining debt (e.g., debt -80, pay 100 → applied 80).

RepaymentAll returns the full payoff amount when debt exists; skip when already paid.

EverythingExcept computes balance - keep and skips when <= 0.

creditPaidOff flag true only in the appropriate cases.

4) “Repayment” alias normalization fixture

Covers: compatibility behavior in normalizeTransferType for “repayment” and “transfer” shorthands.
Use: normalizeTransferType, toNumber.
Assert:

"repayment" with amount 0 becomes REPAYMENT_ALL.

"repayment" with amount >0 becomes REPAYMENT_AMOUNT.

"transfer" becomes TRANSFER_AMOUNT.
This is classic “migration drift” territory.

5) Recurrence month-end clamp fixture (Jan 31 → Feb)

Covers: the hardest real-world date bug: month-end clamping.
Use: addMonthsClamped (via your context), stepForward, expandRecurrence.
Assert:

Starting at Jan 31, monthly recurrence produces clamped dates (e.g., Feb 28/29) rather than rolling into March.

The produced list matches an exact expected date list.

(You already have basic recurrence tests; this one is the “money” edge case you’ll absolutely want.)

6) Window alignment fixture (anchor before window start)

Covers: alignToWindow logic (daily/weekly/monthly) for starting before window/today.
Use: alignToWindow, expandRecurrence.
Assert:

For weekly cadence, the aligned start is the first occurrence on/after windowStart.

For monthly cadence, the aligned start steps by months correctly.

For ONCE events in the past relative to today, result is empty.

7) Policy active range boundary fixture

Covers: inclusive/exclusive behavior at start/end dates.
Use: isPolicyActiveOnDate.
Assert:

Active on exact start date.

Active on exact end date.

Inactive one day before start / one day after end.

This prevents “off-by-one day” policy behavior changes.

8) Applicable auto-deficit policy selection + deterministic ordering fixture

Covers: filtering by type + triggerAccount + activity dates + deterministic sort (priority then name).
Use: getApplicableAutoDeficitPolicies.
Assert:

Only Auto Deficit Cover policies returned.

Only matching triggerAccount returned (via normalize key).

Returned in ascending priority; ties broken by name lexical order.

9) Scenario/tag scope fixture (Base always included)

Covers: scenario set normalization and filtering semantics: Base always in lookup; scenario column only when >1 scenario.
Use: normalizeScenarioSet, buildScenarioLookup, filterByScenarioSet, shouldIncludeScenarioColumn.
Assert:

normalizeScenarioSet([] or null) returns [Base].

Lookup always contains Base even if not present in catalog input.

shouldIncludeScenarioColumn(index!=-1, scenarioIds) is true only when >1 normalized scenario.

10) Summary stats “money tolerance” + stats correctness fixture

Covers: reconciliation helper correctness (tolerance comparisons, min/max dates, net change).
Use: valuesWithinTolerance, computeSeriesStats, countDaysBelow.
Assert:

valuesWithinTolerance(1.00, 1.009, 0.01) true; 1.00 vs 1.02 false.

computeSeriesStats returns correct min/max/start/end/netChange and carries the correct minDate/maxDate.

countDaysBelow counts properly with mixed numeric/string values.

Why these 10, specifically for mid-migration

Because they’re stable contracts around the typed core that you’ve already exposed in TypedBudget (sort, recurrence, transfer resolution, policy filtering, tag scope, stats, normalization).
They don’t require the full sheet runtime, and they massively reduce the chance Codex refactors change behavior.

If you want, I can also give you a fixture file layout (names + what goes in each) that matches your current no-framework test runner (tsx + node assert).


## Scope In
- TODO

## Scope Out
- TODO

## Task Checklist
- [ ] TODO

## Acceptance Criteria
- TODO

## Constraints
- TODO

## Definition Of Done
- [ ] Code implemented
- [ ] Tests added/updated and passing
- [ ] `PR.md` updated with evidence
- [ ] `retro.md` drafted before sprint close

## Risks And Mitigations
- TODO
