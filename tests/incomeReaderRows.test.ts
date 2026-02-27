import assert from "node:assert/strict";

import { mapIncomeReaderRows } from "../ts/core/incomeReaderRows";

const rows = [
  {
    Include: "TRUE",
    "Rule ID": "INC-1",
    Type: "Salary",
    Name: "Monthly Salary",
    Amount: "5000",
    Frequency: "Monthly",
    "Repeat Every": "1",
    "Start Date": "2026-01-01",
    "End Date": "",
    "To Account": "Checking",
    Notes: "net pay",
    Tag: "Base",
  },
  {
    Include: "",
    "Rule ID": "INC-2",
    Tag: "Alt",
  },
];

const mapped = mapIncomeReaderRows(rows, {
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
});

assert.equal(mapped.length, 1);
assert.equal(mapped[0].ruleId, "INC-1");
assert.equal(mapped[0].scenarioId, "Base");
assert.equal(mapped[0].amount, 5000);
assert.equal(mapped[0].paidTo, "Checking");
assert.equal(mapped[0].frequency, "Monthly");
