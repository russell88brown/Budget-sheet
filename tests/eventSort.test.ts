import assert from "node:assert/strict";

import { eventSortPriority, getEventSortKey, getEventSortOrder } from "../ts/core/eventSort";

const config = {
  transferAmount: "Transfer - Amount",
  repaymentAmount: "Repayment - Amount",
  repaymentAll: "Repayment - All",
  transferEverythingExcept: "Transfer - Everything Except",
};

function normalizeTransferType(value: unknown): string {
  return String(value ?? "");
}

assert.deepEqual(getEventSortOrder(config), [
  "Income",
  "Transfer:Transfer - Amount",
  "Transfer:Repayment - Amount",
  "Transfer:Repayment - All",
  "Expense",
  "InterestAccrual",
  "Interest",
  "Transfer:Transfer - Everything Except",
]);

const key = getEventSortKey(
  { kind: "Transfer", transferBehavior: "Transfer - Amount", amount: 10 },
  normalizeTransferType
);
assert.equal(key, "Transfer:Transfer - Amount");

const priorities = [
  eventSortPriority({ kind: "Income" }, normalizeTransferType, config),
  eventSortPriority(
    { kind: "Transfer", transferBehavior: config.transferAmount, amount: 10 },
    normalizeTransferType,
    config
  ),
  eventSortPriority(
    { kind: "Transfer", transferBehavior: config.repaymentAmount, amount: 10 },
    normalizeTransferType,
    config
  ),
  eventSortPriority(
    { kind: "Transfer", transferBehavior: config.repaymentAll, amount: 0 },
    normalizeTransferType,
    config
  ),
  eventSortPriority({ kind: "Expense" }, normalizeTransferType, config),
  eventSortPriority(
    { kind: "Interest", interestAccrual: true },
    normalizeTransferType,
    config
  ),
  eventSortPriority({ kind: "Interest" }, normalizeTransferType, config),
  eventSortPriority(
    {
      kind: "Transfer",
      transferBehavior: config.transferEverythingExcept,
      amount: 0,
    },
    normalizeTransferType,
    config
  ),
];
assert.deepEqual(priorities, [0, 1, 2, 3, 4, 5, 6, 7]);
