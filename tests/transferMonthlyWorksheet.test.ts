import assert from "node:assert/strict";

import { computeTransferMonthlyWorksheet } from "../ts/core/transferMonthlyWorksheet";

const result = computeTransferMonthlyWorksheet(
  [[true, "Base", "Transfer - Amount", 25, "Monthly", 1, "", "", "Cash", "Card", ""]],
  {
    include: 0,
    scenario: 1,
    type: 2,
    amount: 3,
    frequency: 4,
    repeat: 5,
    start: 6,
    end: 7,
    from: 8,
    to: 9,
    total: 10,
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
    normalizeAccountLookupKey: (v) => String(v || "").toLowerCase(),
    normalizeTransferType: (v) => String(v || ""),
    shouldCalculateTransferMonthlyTotal: () => true,
    monthlyFactorForRecurrence: () => 1,
    resolveTransferMonthlyTotal: (_b, a) => (a === null ? null : a),
    roundMoney: (v) => Math.round((v + Number.EPSILON) * 100) / 100,
    accountBalances: { cash: 100, card: -10 },
    incomeTotalsByAccount: {},
    expenseTotalsByAccount: {},
    transferEverythingExceptType: "Transfer - Everything Except",
  },
);

assert.deepEqual(result.out, [[25]]);
assert.deepEqual(result.debits, { cash: 25 });
assert.deepEqual(result.credits, { card: 25 });
