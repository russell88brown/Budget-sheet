import assert from "node:assert/strict";

import {
  computeSeriesStats,
  countDaysBelow,
  valuesWithinTolerance,
} from "../ts/core/summaryStats";

assert.equal(valuesWithinTolerance(10, 10.005, 0.01), true);
assert.equal(valuesWithinTolerance(10, 10.02, 0.01), false);

const rows = [
  [new Date(2026, 0, 1), 100, -20],
  [new Date(2026, 0, 2), 80, -30],
  [new Date(2026, 0, 3), 120, -10],
];

assert.equal(countDaysBelow(rows, 1, 90), 1);
assert.equal(countDaysBelow(rows, 2, 0), 3);

const stats = computeSeriesStats(rows, 1, (value: unknown) => Math.round(Number(value || 0) * 100) / 100);
assert.equal(stats.min, 80);
assert.equal(stats.max, 120);
assert.equal((stats.minDate as Date).getTime(), new Date(2026, 0, 2).getTime());
assert.equal((stats.maxDate as Date).getTime(), new Date(2026, 0, 3).getTime());
assert.equal(stats.start, 100);
assert.equal(stats.end, 120);
assert.equal(stats.netChange, 20);
