import assert from "node:assert/strict";

import { summarizeNegativeCashTopSourcesFromRows } from "../ts/core/summaryExplainability";

const rows = [
  ["2026-01-01", "NEGATIVE_CASH", -20, "INC-1"],
  ["2026-01-01", "", -100, "INC-2"],
  ["2026-01-02", "NEGATIVE_CASH|OTHER", -5, "INC-1"],
  ["2026-01-03", "NEGATIVE_CASH", 10, "INC-3"],
  ["2026-01-03", "NEGATIVE_CASH", -15, ""],
];

const result = summarizeNegativeCashTopSourcesFromRows(
  rows,
  1,
  2,
  3,
  (value: unknown) => {
    if (value === null || value === undefined || value === "") {
      return null;
    }
    const n = Number(value);
    return Number.isNaN(n) ? null : n;
  },
  (value: unknown) => Math.round(Number(value || 0) * 100) / 100
);

assert.equal(result.length, 2);
assert.deepEqual(result[0], ["INC-1", 25, 2]);
assert.deepEqual(result[1], ["(Unattributed)", 15, 1]);
