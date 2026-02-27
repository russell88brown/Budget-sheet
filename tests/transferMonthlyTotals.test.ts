import assert from "node:assert/strict";

import {
  isTransferAmountRequiredForMonthlyTotal,
  resolveTransferMonthlyTotal,
  shouldCalculateTransferMonthlyTotal,
} from "../ts/core/transferMonthlyTotals";

const transferTypes = {
  TRANSFER_AMOUNT: "Transfer - Amount",
  REPAYMENT_AMOUNT: "Repayment - Amount",
  TRANSFER_EVERYTHING_EXCEPT: "Transfer - Everything Except",
  REPAYMENT_ALL: "Repayment - All",
};

assert.equal(
  isTransferAmountRequiredForMonthlyTotal(transferTypes.TRANSFER_AMOUNT, transferTypes),
  true
);
assert.equal(
  isTransferAmountRequiredForMonthlyTotal(transferTypes.REPAYMENT_ALL, transferTypes),
  false
);

assert.equal(
  shouldCalculateTransferMonthlyTotal(
    true,
    true,
    { frequency: "Monthly" },
    "cash",
    "card",
    transferTypes.REPAYMENT_ALL,
    null,
    transferTypes
  ),
  true
);

assert.equal(
  shouldCalculateTransferMonthlyTotal(
    true,
    true,
    { frequency: "Monthly" },
    "cash",
    "card",
    transferTypes.TRANSFER_AMOUNT,
    null,
    transferTypes
  ),
  false
);

assert.equal(
  resolveTransferMonthlyTotal(
    transferTypes.TRANSFER_AMOUNT,
    50,
    1.5,
    { card: -120 },
    "card",
    {
      transferTypes,
      roundMoney: (value: unknown) => Math.round(Number(value || 0) * 100) / 100,
    }
  ),
  75
);

assert.equal(
  resolveTransferMonthlyTotal(
    transferTypes.REPAYMENT_ALL,
    null,
    0.5,
    { card: -120 },
    "card",
    {
      transferTypes,
      roundMoney: (value: unknown) => Math.round(Number(value || 0) * 100) / 100,
    }
  ),
  60
);
