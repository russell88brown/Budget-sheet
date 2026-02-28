import assert from "node:assert/strict";

import { mapExpenseReaderRows } from "../ts/core/expenseReaderRows";

const rows = [
  {
    Include: "TRUE",
    "Rule ID": "EXP-1",
    Type: "Bills",
    Name: "Rent",
    Amount: "1800",
    Frequency: "Monthly",
    "Repeat Every": "1",
    "Start Date": "2026-01-01",
    "End Date": "",
    "From Account": "Checking",
    Notes: "housing",
    Tag: "Base",
  },
  {
    Include: "",
    "Rule ID": "EXP-2",
    Tag: "Alt",
  },
];

const mapped = mapExpenseReaderRows(rows, {
  toBoolean: (v) => v === true || v === "TRUE",
  normalizeScenario: (v) => String(v || "Base"),
  getTagValue: (row) => row.Tag,
  normalizeRecurrence: () => ({
    frequency: "Monthly",
    repeatEvery: 1,
    isSingleOccurrence: false,
    startDate: new Date("2026-01-01"),
    endDate: null,
  }),
  toNumber: (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  },
  expenseBehaviorLabel: "Expense",
});

assert.equal(mapped.length, 1);
assert.equal(mapped[0].ruleId, "EXP-1");
assert.equal(mapped[0].scenarioId, "Base");
assert.equal(mapped[0].amount, 1800);
assert.equal(mapped[0].paidFrom, "Checking");
assert.equal(mapped[0].paidTo, "External");
assert.equal(mapped[0].behavior, "Expense");
