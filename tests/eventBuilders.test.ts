import assert from "node:assert/strict";

import {
  buildExpenseEvents,
  buildIncomeEvents,
  buildInterestEvents,
  buildSourceRuleId,
  buildTransferEvents,
} from "../ts/core/eventBuilders";

const day1 = new Date(2026, 0, 1);
const day2 = new Date(2026, 0, 2);
const day3 = new Date(2026, 0, 3);

const ctx = {
  expandRecurrence: (_options: Record<string, unknown>) => [day1],
  frequencies: { DAILY: "Daily" },
  behaviorLabels: { Expense: "Expense" },
  buildSourceRuleId: (prefix: string, source: Record<string, unknown>, fallbackName: unknown) =>
    buildSourceRuleId(prefix, source, fallbackName),
  getForecastWindow: () => ({ start: day1, end: day3 }),
};

assert.equal(buildSourceRuleId("INC", { ruleId: "abc" }, "Name"), "abc");
assert.equal(buildSourceRuleId("INC", {}, "Salary Payment"), "INC:SALARY_PAYMENT");
assert.equal(buildSourceRuleId("INC", {}, ""), "INC:UNKNOWN");

const income = buildIncomeEvents(
  [{ scenarioId: "Base", startDate: day1, frequency: "Monthly", repeatEvery: 1, endDate: day3, paidTo: "Cash", name: "Salary", amount: 1000 }],
  ctx
);
assert.equal(income.length, 1);
assert.equal(income[0].kind, "Income");
assert.equal(income[0].sourceRuleId, "INC:SALARY");
assert.equal(income[0].to, "Cash");

const expenses = buildExpenseEvents(
  [{ scenarioId: "Base", startDate: day1, frequency: "Monthly", repeatEvery: 1, endDate: day3, paidFrom: "Cash", type: "Bills", name: "Power", amount: 50 }],
  ctx
);
assert.equal(expenses.length, 1);
assert.equal(expenses[0].kind, "Expense");
assert.equal(expenses[0].name, "Bills - Power");
assert.equal(expenses[0].sourceRuleId, "EXP:BILLS_POWER");

const transfers = buildTransferEvents(
  [{ scenarioId: "Base", startDate: day1, frequency: "Monthly", repeatEvery: 1, endDate: day3, paidFrom: "Cash", paidTo: "Card", type: "Transfer - Amount", name: "Pay card", amount: 200 }],
  ctx
);
assert.equal(transfers.length, 1);
assert.equal(transfers[0].kind, "Transfer");
assert.equal(transfers[0].sourceRuleId, "TRN:PAY_CARD");

const interestCtx = {
  ...ctx,
  expandRecurrence: (options: Record<string, unknown>) => {
    if (options.frequency === "Daily") {
      return [day1, day2, day3];
    }
    return [day3];
  },
};

const interestEvents = buildInterestEvents(
  [{
    scenarioId: "Base",
    name: "Loan",
    interestPostingFrequency: "Monthly",
    interestPostingRepeatEvery: 1,
    interestPostingStartDate: day1,
    interestRate: 12,
    interestMonthlyFee: 3,
    interestMethod: "Simple",
  }],
  interestCtx
);
assert.equal(interestEvents.length, 4);
assert.equal(interestEvents.filter((x) => x.behavior === "Interest Accrual").length, 3);
assert.equal(interestEvents.filter((x) => x.behavior === "Interest").length, 1);
