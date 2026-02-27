import assert from "node:assert/strict";

import {
  alignToWindow,
  expandRecurrence,
  getStepDays,
  getStepMonths,
  normalizeRepeatEvery,
  periodsPerYear,
  stepForward,
} from "../ts/core/recurrence";
import { addDays, addMonthsClamped, normalizeDate } from "../ts/core/dateMath";

const frequencies = {
  ONCE: "Once",
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
};

function toYmd(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

assert.equal(normalizeRepeatEvery(undefined), 1);
assert.equal(normalizeRepeatEvery(0), 1);
assert.equal(normalizeRepeatEvery(2.9), 2);

assert.equal(getStepDays(frequencies.DAILY, 3, frequencies), 3);
assert.equal(getStepDays(frequencies.WEEKLY, 2, frequencies), 14);
assert.equal(getStepDays(frequencies.MONTHLY, 1, frequencies), null);

assert.equal(getStepMonths(frequencies.MONTHLY, 2, frequencies), 2);
assert.equal(getStepMonths(frequencies.YEARLY, 2, frequencies), 24);
assert.equal(getStepMonths(frequencies.DAILY, 1, frequencies), null);

assert.equal(periodsPerYear(frequencies.MONTHLY, 2, frequencies), 6);
assert.equal(periodsPerYear(frequencies.ONCE, 1, frequencies), 0);

const stepped = stepForward(new Date(2026, 0, 1), frequencies.WEEKLY, 2, {
  frequencies,
  addDays,
  addMonthsClamped,
});
assert.ok(stepped);
assert.equal(stepped?.getTime(), new Date(2026, 0, 15).getTime());

const aligned = alignToWindow(
  new Date(2026, 0, 15),
  frequencies.MONTHLY,
  1,
  new Date(2026, 1, 1),
  { frequencies, addDays, addMonthsClamped }
);
assert.ok(aligned);
assert.equal(aligned?.getTime(), new Date(2026, 1, 15).getTime());

const alignedWeekly = alignToWindow(
  new Date(2026, 0, 1),
  frequencies.WEEKLY,
  1,
  new Date(2026, 0, 10),
  { frequencies, addDays, addMonthsClamped }
);
assert.ok(alignedWeekly);
assert.equal(alignedWeekly?.getTime(), new Date(2026, 0, 15).getTime());

const alignedMonthlyFromPast = alignToWindow(
  new Date(2026, 0, 31),
  frequencies.MONTHLY,
  1,
  new Date(2026, 3, 1),
  { frequencies, addDays, addMonthsClamped }
);
assert.ok(alignedMonthlyFromPast);
assert.equal(alignedMonthlyFromPast?.getTime(), new Date(2026, 3, 30).getTime());

const expandedDaily = expandRecurrence(
  {
    startDate: new Date(2026, 0, 1),
    frequency: frequencies.DAILY,
    repeatEvery: 1,
    endDate: new Date(2026, 0, 3),
  },
  {
    frequencies,
    normalizeDate,
    addDays,
    addMonthsClamped,
    window: { start: new Date(2026, 0, 1), end: new Date(2026, 0, 31) },
    today: new Date(2026, 0, 1),
  }
);
assert.equal(expandedDaily.length, 3);
assert.equal(expandedDaily[0].getTime(), normalizeDate(new Date(2026, 0, 1)).getTime());
assert.equal(expandedDaily[2].getTime(), normalizeDate(new Date(2026, 0, 3)).getTime());

const expandedMonthlyClamp = expandRecurrence(
  {
    startDate: new Date(2026, 0, 31),
    frequency: frequencies.MONTHLY,
    repeatEvery: 1,
    endDate: new Date(2026, 3, 30),
  },
  {
    frequencies,
    normalizeDate,
    addDays,
    addMonthsClamped,
    window: { start: new Date(2026, 0, 1), end: new Date(2026, 11, 31) },
    today: new Date(2026, 0, 1),
  }
);
assert.deepEqual(
  expandedMonthlyClamp.map((date) => toYmd(date)),
  ["2026-01-31", "2026-02-28", "2026-03-28", "2026-04-28"]
);

const expandedOncePast = expandRecurrence(
  {
    startDate: new Date(2026, 0, 1),
    frequency: frequencies.ONCE,
    repeatEvery: 1,
  },
  {
    frequencies,
    normalizeDate,
    addDays,
    addMonthsClamped,
    window: { start: new Date(2026, 0, 1), end: new Date(2026, 0, 31) },
    today: new Date(2026, 0, 10),
  }
);
assert.equal(expandedOncePast.length, 0);

const singleByEqualEnd = expandRecurrence(
  {
    startDate: new Date(2026, 1, 7),
    frequency: frequencies.MONTHLY,
    repeatEvery: 1,
    endDate: new Date(2026, 1, 7),
  },
  {
    frequencies,
    normalizeDate,
    addDays,
    addMonthsClamped,
    window: { start: new Date(2026, 1, 1), end: new Date(2026, 2, 31) },
    today: new Date(2026, 1, 1),
  }
);
assert.equal(singleByEqualEnd.length, 1);
assert.equal(singleByEqualEnd[0].getTime(), normalizeDate(new Date(2026, 1, 7)).getTime());
