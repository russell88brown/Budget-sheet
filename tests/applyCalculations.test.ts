import assert from "node:assert/strict";

import {
  computeInterestFeePerPosting,
  estimateTransferOutgoingAmount,
  resolveTransferAmount,
} from "../ts/core/applyCalculations";

const transferTypes = {
  TRANSFER_EVERYTHING_EXCEPT: "Transfer - Everything Except",
  TRANSFER_AMOUNT: "Transfer - Amount",
  REPAYMENT_AMOUNT: "Repayment - Amount",
  REPAYMENT_ALL: "Repayment - All",
};

const ctx = {
  transferTypes,
  accountKey: (value: unknown) => String(value || "").toLowerCase(),
  roundMoney: (value: unknown) => Math.round(Number(value || 0) * 100) / 100,
};

assert.equal(
  estimateTransferOutgoingAmount(
    { card: -300 },
    { transferBehavior: transferTypes.REPAYMENT_ALL, to: "Card", amount: 50 },
    ctx
  ),
  300
);

assert.equal(
  estimateTransferOutgoingAmount(
    { card: -300 },
    { transferBehavior: transferTypes.REPAYMENT_AMOUNT, to: "Card", amount: 50 },
    ctx
  ),
  50
);

assert.equal(
  estimateTransferOutgoingAmount(
    { card: 10 },
    { transferBehavior: transferTypes.REPAYMENT_AMOUNT, to: "Card", amount: 50 },
    ctx
  ),
  0
);

const resolvedEverythingExcept = resolveTransferAmount(
  { cash: 1000 },
  { transferBehavior: transferTypes.TRANSFER_EVERYTHING_EXCEPT, from: "Cash" },
  200,
  ctx
);
assert.equal(resolvedEverythingExcept.skip, false);
assert.equal(resolvedEverythingExcept.amount, 800);

const resolvedPaidOff = resolveTransferAmount(
  { card: 0 },
  { transferBehavior: transferTypes.REPAYMENT_ALL, to: "Card" },
  100,
  ctx
);
assert.equal(resolvedPaidOff.skip, true);
assert.equal(resolvedPaidOff.creditPaidOff, true);

const resolvedCapped = resolveTransferAmount(
  { card: -80 },
  { transferBehavior: transferTypes.REPAYMENT_AMOUNT, to: "Card" },
  100,
  ctx
);
assert.equal(resolvedCapped.skip, false);
assert.equal(resolvedCapped.amount, 80);

const fee = computeInterestFeePerPosting(
  { monthlyFee: 10, frequency: "Monthly", repeatEvery: 1 },
  {
    toNumber: (value: unknown) => {
      if (value === null || value === undefined || value === "") {
        return null;
      }
      const n = Number(value);
      return Number.isNaN(n) ? null : n;
    },
    periodsPerYear: () => 12,
  }
);
assert.equal(fee, 10);
