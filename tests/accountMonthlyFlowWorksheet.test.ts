import assert from "node:assert/strict";

import { computeAccountMonthlyFlowWorksheet } from "../ts/core/accountMonthlyFlowWorksheet";

const result = computeAccountMonthlyFlowWorksheet(
  [["Cash", "Base", "", "", "", ""]],
  {
    name: 0,
    scenario: 1,
    interestAvg: 2,
    expenseAvg: 3,
    incomeAvg: 4,
    netFlow: 5,
  },
  {
    defaultScenarioId: "Base",
    activeScenarioId: "Base",
    normalizeScenarioId: (v) => String(v || "Base"),
    normalizeAccountLookupKey: (v) => String(v || "").toLowerCase(),
    accountByKey: {
      cash: {
        forecast: true,
        interestRate: 12,
        balance: 1000,
        interestPostingFrequency: "Monthly",
        interestMethod: "APR",
        interestMonthlyFee: 5,
      },
    },
    toNumber: (v) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    },
    computeEstimatedMonthlyInterest: (b, r) => Math.round(((b * (r / 100 / 12)) + Number.EPSILON) * 100) / 100,
    roundMoney: (v) => Math.round((v + Number.EPSILON) * 100) / 100,
    incomeTotalsByAccount: { cash: 100 },
    expenseTotalsByAccount: { cash: 20 },
    transferCredits: { cash: 10 },
    transferDebits: { cash: 2 },
  },
);

assert.deepEqual(result.interestAvgValues, [[10]]);
assert.deepEqual(result.expenseAvgValues, [[27]]);
assert.deepEqual(result.incomeAvgValues, [[110]]);
assert.deepEqual(result.netFlowValues, [[93]]);
