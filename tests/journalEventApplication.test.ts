import assert from "node:assert/strict";

import {
  applyEventWithSnapshots,
  buildAccountTypesByKey,
  cloneBalances,
} from "../ts/core/journalEventApplication";

const accountKey = (value: unknown) => String(value || "").trim().toLowerCase();
const roundMoney = (value: unknown) => Math.round(Number(value || 0) * 100) / 100;

assert.deepEqual(cloneBalances({ cash: 10, card: -2 }), { cash: 10, card: -2 });
assert.deepEqual(
  buildAccountTypesByKey(
    [{ name: "Cash", type: "Cash" }, { name: "Card", type: "Credit" }],
    accountKey
  ),
  { cash: "Cash", card: "Credit" }
);

const ctx = {
  roundMoney,
  accountKey,
  cloneBalances: (balances: Record<string, number>) => ({ ...balances }),
  computeInterestAmount: (_balances: Record<string, number>, event: any) =>
    event.interestAccrual ? 0 : 5,
  resolveTransferAmount: (_balances: Record<string, number>, _event: any, amount: number) => ({
    amount,
    skip: amount <= 0,
  }),
};

const incomeBalances = { cash: 100 };
const incomeEvent: any = { kind: "Income", to: "Cash", amount: 20 };
const incomeSnapshots = applyEventWithSnapshots(incomeBalances, incomeEvent, ctx);
assert.equal(incomeBalances.cash, 120);
assert.equal(incomeEvent.appliedAmount, 20);
assert.equal(incomeSnapshots.afterTo.cash, 120);

const transferBalances = { cash: 100, card: -50 };
const transferEvent: any = { kind: "Transfer", from: "Cash", to: "Card", amount: 25 };
const transferSnapshots = applyEventWithSnapshots(transferBalances, transferEvent, ctx);
assert.equal(transferBalances.cash, 75);
assert.equal(transferBalances.card, -25);
assert.equal(transferSnapshots.afterFrom.cash, 75);
assert.equal(transferSnapshots.afterTo.card, -25);
