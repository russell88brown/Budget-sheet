import assert from "node:assert/strict";

import { normalizeRecurrenceRows } from "../ts/core/recurrenceRowNormalization";

const start = new Date("2026-01-15T00:00:00.000Z");
const rows = [
  ["Biweekly", "", start, ""],
  ["Monthly", 1, start, ""],
];

const result = normalizeRecurrenceRows(
  rows,
  0,
  1,
  2,
  3,
  (frequencyValue, repeatEveryValue, startDateValue, endDateValue) => {
    const lower = String(frequencyValue || "").toLowerCase();
    if (lower === "biweekly") {
      return {
        frequency: "Weekly",
        repeatEvery: 2,
        endDate: endDateValue || startDateValue,
      };
    }
    return {
      frequency: frequencyValue,
      repeatEvery: repeatEveryValue,
      endDate: endDateValue,
    };
  },
);

assert.equal(result.updated, true);
assert.equal(result.rows[0][0], "Weekly");
assert.equal(result.rows[0][1], 2);
assert.equal(String(result.rows[0][3]), String(start));
assert.deepEqual(result.rows[1], rows[1]);

// Ensure source rows remain unchanged.
assert.equal(rows[0][0], "Biweekly");
assert.equal(rows[0][1], "");
