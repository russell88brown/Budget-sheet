import assert from "node:assert/strict";

import { deactivateRowsByValidator } from "../ts/core/rowDeactivation";

const rows = [
  [true, "ok"],
  [true, ""],
  [false, ""],
];

const result = deactivateRowsByValidator(
  rows,
  0,
  (v) => v === true,
  (row) => {
    if (!row[1]) {
      return ["missing value"];
    }
    return [];
  },
  {},
);

assert.equal(result.updated, 1);
assert.deepEqual(result.rows[0], [true, "ok"]);
assert.deepEqual(result.rows[1], [false, ""]);
assert.deepEqual(result.rows[2], [false, ""]);

// Ensure source rows remain unchanged.
assert.deepEqual(rows[1], [true, ""]);
