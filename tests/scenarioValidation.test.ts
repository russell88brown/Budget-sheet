import assert from "node:assert/strict";

import { disableUnknownScenarioRows } from "../ts/core/scenarioValidation";

const rows = [
  [true, "Base", "A"],
  [true, "Stress", "B"],
  [false, "Unknown", "C"],
];

const result = disableUnknownScenarioRows(
  rows,
  0,
  1,
  { Base: true },
  (value) => value === true,
  (value) => String(value || "Base"),
);

assert.equal(result.updated, true);
assert.equal(result.disabledCount, 1);
assert.equal(result.rows[0][0], true);
assert.equal(result.rows[1][0], false);
assert.equal(result.rows[2][0], false);

// Ensure source rows remain unchanged.
assert.equal(rows[1][0], true);
