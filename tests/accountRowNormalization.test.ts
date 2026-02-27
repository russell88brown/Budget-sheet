import assert from "node:assert/strict";

import { normalizeAccountRows } from "../ts/core/accountRowNormalization";

const rows = [
  ["cash", "TRUE", "x", "x", "x", "x", "x", "x", "monthly", "APR", ""],
];

const result = normalizeAccountRows(
  rows,
  {
    type: 0,
    include: 1,
    expenseAvg: 2,
    interestAvg: 3,
    incomeAvg: 4,
    netFlow: 5,
    rate: 6,
    fee: 7,
    method: 8,
    frequency: 9,
    repeat: 10,
  },
  {
    normalizeAccountType: (v) => String(v || "").toUpperCase(),
    toBoolean: (v) => v === true || v === "TRUE",
    isValidAccountSummaryNumber: (v) => typeof v === "number",
    isValidNumberOrBlank: (v) => v === "" || typeof v === "number",
    normalizeInterestMethod: (v) => (String(v || "").toLowerCase() === "apr" ? "APR" : ""),
    normalizeInterestFrequency: (v) => (String(v || "").toLowerCase() === "monthly" ? "Monthly" : ""),
    toPositiveInt: (v) => {
      const n = Number(v);
      return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
    },
  },
);

assert.equal(result.updated, true);
assert.equal(result.rows[0][0], "CASH");
assert.equal(result.rows[0][1], true);
assert.equal(result.rows[0][2], "");
assert.equal(result.rows[0][8], "APR");
assert.equal(result.rows[0][9], "Monthly");
assert.equal(result.rows[0][10], 1);

// Ensure source rows remain unchanged.
assert.equal(rows[0][0], "cash");
assert.equal(rows[0][1], "TRUE");
