import assert from "node:assert/strict";

import { computeRuleMonthlyWorksheet } from "../ts/core/ruleMonthlyWorksheet";

const out = computeRuleMonthlyWorksheet(
  [
    [true, "Base", 100, "Monthly", 1, "", "", "Cash", ""],
    [true, "Stress", 100, "Monthly", 1, "", "", "Cash", 10],
  ],
  {
    include: 0,
    scenario: 1,
    amount: 2,
    frequency: 3,
    repeat: 4,
    start: 5,
    end: 6,
    account: 7,
    total: 8,
  },
  {
    activeScenarioId: "Base",
    defaultScenarioId: "Base",
    normalizeScenarioId: (v) => String(v || "Base"),
    toBoolean: (v) => v === true,
    toNumber: (v) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    },
    normalizeRecurrence: (f, r) => ({
      frequency: f,
      repeatEvery: r,
      startDate: null,
      endDate: null,
      isSingleOccurrence: false,
    }),
    isRecurringForMonthlyAverage: () => true,
    monthlyFactorForRecurrence: () => 1,
    roundMoney: (v) => Math.round((v + Number.EPSILON) * 100) / 100,
  },
);

assert.deepEqual(out, [[100], [10]]);
