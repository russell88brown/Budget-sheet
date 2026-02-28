import assert from "node:assert/strict";

import { mapGoalReaderRows } from "../ts/core/goalReaderRows";

const rows = [
  {
    Include: "TRUE",
    "Rule ID": "GOAL-1",
    "Goal Name": "Emergency Fund",
    "Target Amount": "1500",
    "Target Date": "2026-12-31",
    Priority: "",
    "Funding Account": "Savings",
    "Funding Policy": "Fixed Amount",
    "Amount Per Month": "125",
    "Percent Of Inflow": "",
    Notes: "build runway",
    Tag: "Base",
  },
  {
    Include: false,
    "Rule ID": "GOAL-2",
    Tag: "Alt",
  },
];

const mapped = mapGoalReaderRows(rows, {
  toBoolean: (v) => v === true || v === "TRUE",
  normalizeScenario: (v) => String(v || "Base"),
  getTagValue: (row) => row.Tag,
  toNumber: (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  },
  toDate: (v) => {
    if (!v) {
      return null;
    }
    const d = new Date(String(v));
    return Number.isNaN(d.getTime()) ? null : d;
  },
  toPositiveInt: (v) => {
    const n = Number(v);
    return Number.isInteger(n) && n > 0 ? n : null;
  },
});

assert.equal(mapped.length, 1);
assert.equal(mapped[0].ruleId, "GOAL-1");
assert.equal(mapped[0].name, "Emergency Fund");
assert.equal(mapped[0].scenarioId, "Base");
assert.equal(mapped[0].targetAmount, 1500);
assert.equal(mapped[0].priority, 100);
assert.equal(mapped[0].amountPerMonth, 125);
