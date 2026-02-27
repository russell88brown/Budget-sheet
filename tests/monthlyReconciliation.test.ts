import assert from "node:assert/strict";

import { reconcileMonthlyWithDaily } from "../ts/core/monthlyReconciliation";

const normalizeDate = (value: unknown) => new Date(value as string | number | Date);
const normalizeTag = (value: unknown) => String(value || "Base").trim() || "Base";
const valuesWithinTolerance = (left: unknown, right: unknown) =>
  Math.abs(Number(left || 0) - Number(right || 0)) <= 0.01;

const daily = {
  includeScenarioColumn: false,
  accountNames: ["Cash Account"],
  rows: [
    [new Date(2026, 0, 1), 100, -20, 80, 100],
    [new Date(2026, 0, 31), 120, -10, 110, 120],
    [new Date(2026, 1, 1), 120, -10, 110, 120],
    [new Date(2026, 1, 28), 140, -15, 125, 140],
  ],
};

const monthly = {
  includeScenarioColumn: false,
  rows: [
    [new Date(2026, 0, 1), 120, -10, 110, 100, 120, 20, 120],
    [new Date(2026, 1, 1), 140, -15, 125, 120, 140, 20, 140],
  ],
};

assert.equal(
  reconcileMonthlyWithDaily(monthly, daily, {
    normalizeDate,
    normalizeTag,
    valuesWithinTolerance,
  }),
  null
);

const monthlyMismatch = {
  includeScenarioColumn: false,
  rows: [[new Date(2026, 0, 1), 120, -10, 111, 100, 120, 20, 120]],
};

const error = reconcileMonthlyWithDaily(monthlyMismatch, daily, {
  normalizeDate,
  normalizeTag,
  valuesWithinTolerance,
});
assert.equal(
  error,
  "Monthly reconciliation failed: month row count does not match Daily."
);
