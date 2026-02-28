import assert from "node:assert/strict";

import { buildExpenseMonthlyTotals, buildIncomeMonthlyTotals } from "../ts/core/monthlyRuleTotals";

const ctx = {
  isRecurringForMonthlyAverage: () => true,
  toNumber: (v: unknown) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  },
  monthlyFactorForRecurrence: () => 1,
  normalizeAccountLookupKey: (v: unknown) => String(v || "").trim().toLowerCase(),
  roundMoney: (v: number) => Math.round((v + Number.EPSILON) * 100) / 100,
};

assert.deepEqual(
  buildIncomeMonthlyTotals(
    [
      { paidTo: "Cash", frequency: "Monthly", amount: 100 },
      { paidTo: "Cash", frequency: "Monthly", amount: 20.25 },
    ],
    ctx,
  ),
  { cash: 120.25 },
);

assert.deepEqual(
  buildExpenseMonthlyTotals(
    [
      { paidFrom: "Card", frequency: "Monthly", amount: 50 },
      { paidFrom: "Card", frequency: "Monthly", amount: 5.5 },
    ],
    ctx,
  ),
  { card: 55.5 },
);
