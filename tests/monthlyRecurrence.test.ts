import assert from "node:assert/strict";

import {
  isRecurringForMonthlyAverage,
  monthlyFactorForRecurrence,
} from "../ts/core/monthlyRecurrence";

const ctx = {
  toDate: (value: unknown) => {
    if (!value) {
      return null;
    }
    const d = new Date(value as string | number | Date);
    return Number.isNaN(d.getTime()) ? null : d;
  },
  normalizeDate: (value: unknown) => {
    const d = new Date(value as string | number | Date);
    d.setHours(0, 0, 0, 0);
    return d;
  },
  periodsPerYear: (frequency: unknown, repeatEvery: unknown) => {
    const f = String(frequency || "");
    const every = Math.max(1, Math.floor(Number(repeatEvery || 1)));
    if (f === "Monthly") return 12 / every;
    if (f === "Yearly") return 1 / every;
    return 0;
  },
};

assert.equal(
  isRecurringForMonthlyAverage(
    { isSingleOccurrence: true, startDate: "2026-01-01", endDate: "2026-01-01" },
    ctx
  ),
  false
);
assert.equal(
  isRecurringForMonthlyAverage(
    { isSingleOccurrence: false, startDate: "2026-01-01", endDate: "2026-01-01" },
    ctx
  ),
  false
);
assert.equal(
  isRecurringForMonthlyAverage(
    { isSingleOccurrence: false, startDate: "2026-01-01", endDate: "2026-01-02" },
    ctx
  ),
  true
);

assert.equal(monthlyFactorForRecurrence("Monthly", 1, ctx.periodsPerYear), 1);
assert.equal(monthlyFactorForRecurrence("Yearly", 1, ctx.periodsPerYear), 1 / 12);
assert.equal(monthlyFactorForRecurrence("Unknown", 1, ctx.periodsPerYear), 0);
