import assert from "node:assert/strict";

import {
  validateExpenseRowReasons,
  validateIncomeRowReasons,
  validateTransferRowReasons,
  type JournalRowIndexes,
} from "../ts/core/journalRowValidation";

const indexes: JournalRowIndexes = {
  scenario: 0,
  type: 1,
  name: 2,
  amount: 3,
  frequency: 4,
  start: 5,
  account: 6,
  from: 7,
  to: 8,
};

const ctx = {
  defaultScenarioId: "Base",
  normalizeScenarioId: (value: unknown) => String(value || "Base"),
  toNumber: (value: unknown) => {
    if (value === null || value === undefined || value === "") {
      return null;
    }
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  },
  toDate: (value: unknown) => {
    if (!value) {
      return null;
    }
    const date = new Date(String(value));
    return Number.isNaN(date.getTime()) ? null : date;
  },
  normalizeAccountLookupKey: (value: unknown) => String(value || "").trim().toLowerCase(),
  hasValidAccountForScenario: (scenarioId: string, accountKey: string) =>
    scenarioId === "Base" && (accountKey === "cash" || accountKey === "card"),
  normalizeTransferType: (value: unknown) => String(value || ""),
  transferTypes: {
    REPAYMENT_AMOUNT: "Repayment - Amount",
    REPAYMENT_ALL: "Repayment - All",
    TRANSFER_AMOUNT: "Transfer - Amount",
    TRANSFER_EVERYTHING_EXCEPT: "Transfer - Everything Except",
  },
};

assert.deepEqual(
  validateIncomeRowReasons(["Base", "Salary", "Pay", 2000, "Monthly", "2026-01-01", "cash"], indexes, ctx),
  [],
);
assert.ok(
  validateIncomeRowReasons(["Base", "", "", 0, "", "", ""], indexes, ctx).includes(
    "missing type",
  ),
);

assert.deepEqual(
  validateTransferRowReasons(
    ["Base", "Transfer - Amount", "Move", 100, "Monthly", "2026-01-01", "", "cash", "card"],
    indexes,
    ctx,
  ),
  [],
);
assert.ok(
  validateTransferRowReasons(["Base", "Invalid", "", -1, "", "", "", "", ""], indexes, ctx).includes(
    "invalid transfer type",
  ),
);

assert.deepEqual(
  validateExpenseRowReasons(
    ["Base", "Bills", "Electric", 120, "Monthly", "2026-01-01", "", "cash", ""],
    indexes,
    ctx,
  ),
  [],
);
assert.ok(
  validateExpenseRowReasons(["Base", "", "", -1, "", "", "", "", ""], indexes, ctx).includes(
    "missing from account",
  ),
);
