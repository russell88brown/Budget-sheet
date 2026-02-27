import assert from "node:assert/strict";

import { buildTransferMonthlyTotals } from "../ts/core/transferRuleTotals";

const result = buildTransferMonthlyTotals(
  [{ paidFrom: "Cash", paidTo: "Card", type: "Repayment - Amount", amount: 50, frequency: "Monthly" }],
  [{ name: "Cash", balance: 100 }, { name: "Card", balance: -200 }],
  { cash: 100 },
  { cash: 20 },
  {
    normalizeAccountLookupKey: (v) => String(v || "").toLowerCase(),
    toNumber: (v) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    },
    normalizeTransferType: (v) => String(v || ""),
    monthlyFactorForRecurrence: () => 1,
    isRecurringForMonthlyAverage: () => true,
    roundMoney: (v) => Math.round((v + Number.EPSILON) * 100) / 100,
    transferTypes: {
      TRANSFER_AMOUNT: "Transfer - Amount",
      REPAYMENT_AMOUNT: "Repayment - Amount",
      REPAYMENT_ALL: "Repayment - All",
      TRANSFER_EVERYTHING_EXCEPT: "Transfer - Everything Except",
    },
  },
);

assert.deepEqual(result, {
  credits: { card: 50 },
  debits: { cash: 50 },
});
