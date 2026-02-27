import assert from "node:assert/strict";

import { normalizeTransferRows } from "../ts/core/transferRowNormalization";

const rows = [
  ["transfer", 25],
  ["repayment", 10],
  ["Repayment - All", 12],
];

const result = normalizeTransferRows(
  rows,
  0,
  1,
  (value, amount) => {
    const lower = String(value || "").toLowerCase();
    if (lower === "transfer") {
      return "Transfer - Amount";
    }
    if (lower === "repayment") {
      return amount === 0 ? "Repayment - All" : "Repayment - Amount";
    }
    return String(value || "");
  },
  (value) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  },
  "Repayment - All",
);

assert.equal(result.updated, true);
assert.deepEqual(result.rows[0], ["Transfer - Amount", 25]);
assert.deepEqual(result.rows[1], ["Repayment - Amount", 10]);
assert.deepEqual(result.rows[2], ["Repayment - All", 0]);

// Ensure source rows remain unchanged.
assert.deepEqual(rows[0], ["transfer", 25]);
assert.deepEqual(rows[2], ["Repayment - All", 12]);
