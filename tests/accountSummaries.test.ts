import assert from "node:assert/strict";

import {
  computeEstimatedMonthlyInterest,
  getAccountSummaryHeaderIndexes,
  normalizeAccountTotalsKeys,
  normalizeTransferTotalsKeys,
} from "../ts/core/accountSummaries";

const roundMoney = (value: unknown) => Math.round(Number(value || 0) * 100) / 100;
const normalizeAccountLookupKey = (value: unknown) => String(value || "").trim().toLowerCase();
const toNumber = (value: unknown): number | null => {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const normalized = normalizeAccountTotalsKeys(
  {
    " Checking ": 10,
    checking: "2.5",
    Savings: "",
    Debt: -4.27,
  },
  { normalizeAccountLookupKey, toNumber, roundMoney }
);
assert.deepEqual(normalized, { checking: 12.5, debt: -4.27 });

const transferTotals = normalizeTransferTotalsKeys(
  {
    credits: { A: 3, a: 2 },
    debits: { Loan: -5 },
  },
  { normalizeAccountLookupKey, toNumber, roundMoney }
);
assert.deepEqual(transferTotals, { credits: { a: 5 }, debits: { loan: -5 } });

const indexes = getAccountSummaryHeaderIndexes([
  "Account Name",
  "Money In / Month",
  "Money Out / Month",
  "Net Interest / Month",
  "Net Change / Month",
]);
assert.deepEqual(indexes, { credits: 1, debits: 2, interest: 3, net: 4 });

const simple = computeEstimatedMonthlyInterest(1000, 12, "SIMPLE", {
  apyCompoundMethod: "APY_COMPOUND",
  roundMoney,
});
assert.equal(simple, 10);

const apy = computeEstimatedMonthlyInterest(1000, 12, "APY_COMPOUND", {
  apyCompoundMethod: "APY_COMPOUND",
  roundMoney,
});
assert.equal(apy, 9.49);
