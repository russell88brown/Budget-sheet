import assert from "node:assert/strict";

import {
  accrueDailyInterest,
  computeInterestAmount,
  getDeficitCoverageNeedForEvent,
  getInterestBucket,
} from "../ts/core/journalDeficitInterest";

const accountKey = (value: unknown) => String(value || "").trim().toLowerCase();
const roundMoney = (value: unknown) => Math.round(Number(value || 0) * 100) / 100;
const toNumber = (value: unknown): number | null => {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const deficitCtx = {
  accountKey,
  roundMoney,
  toNumber,
  estimateTransferOutgoingAmount: (_balances: Record<string, number>, event: any) =>
    roundMoney(event.amount || 0),
  creditAccountType: "Credit",
  autoDeficitCoverPolicyType: "AUTO_DEFICIT_COVER",
};

const need = getDeficitCoverageNeedForEvent(
  { checking: 100 },
  { kind: "Expense", from: "Checking", amount: 120 },
  { checking: "Cash" },
  10,
  deficitCtx
);
assert.deepEqual(need, { account: "Checking", amount: 30 });

const noNeed = getDeficitCoverageNeedForEvent(
  { card: -100 },
  { kind: "Expense", from: "Card", amount: 20 },
  { card: "Credit" },
  0,
  deficitCtx
);
assert.equal(noNeed, null);

const interestCtx = {
  accountKey,
  roundMoney,
  normalizeDate: (value: unknown) => new Date(value as string | number | Date),
  computeInterestFeePerPosting: (_event: any) => 1,
  apyCompoundMethod: "APY_COMPOUND",
};

const bucket: { accrued: number; lastPostingDate: Date | null } = { accrued: 0, lastPostingDate: null };
accrueDailyInterest({ savings: 1000 }, { account: "Savings", rate: 36, method: "APR_SIMPLE" }, bucket, interestCtx);
assert.equal(bucket.accrued > 0, true);

const posted = computeInterestAmount(
  { savings: 1000 },
  { account: "Savings", date: new Date(2026, 0, 10) },
  bucket,
  interestCtx
);
assert.equal(typeof posted, "number");
assert.equal(bucket.accrued, 0);
assert.equal(bucket.lastPostingDate instanceof Date, true);

const state: any = {};
const stateBucket = getInterestBucket(state, "savings");
assert.deepEqual(stateBucket, { accrued: 0, lastPostingDate: null });
stateBucket.accrued = 4;
assert.equal(getInterestBucket(state, "savings").accrued, 4);
