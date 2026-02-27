import assert from "node:assert/strict";

import { eventSortPriority, getEventSortKey } from "../ts/core/eventSort";

const config = {
  transferAmount: "Transfer - Amount",
  repaymentAmount: "Repayment - Amount",
  repaymentAll: "Repayment - All",
  transferEverythingExcept: "Transfer - Everything Except",
};

function normalizeTransferType(value: unknown): string {
  return String(value ?? "");
}

const key = getEventSortKey(
  { kind: "Transfer", transferBehavior: "Transfer - Amount", amount: 10 },
  normalizeTransferType
);
assert.equal(key, "Transfer:Transfer - Amount");

const income = eventSortPriority({ kind: "Income" }, normalizeTransferType, config);
const expense = eventSortPriority({ kind: "Expense" }, normalizeTransferType, config);
assert.ok(income < expense);
