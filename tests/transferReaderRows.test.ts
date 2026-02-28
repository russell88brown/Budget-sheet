import assert from "node:assert/strict";

import { mapTransferReaderRows } from "../ts/core/transferReaderRows";

const rows = [
  {
    Include: "TRUE",
    "Rule ID": "TRN-1",
    Type: "Transfer",
    Name: "Move to savings",
    Amount: "250",
    Frequency: "Monthly",
    "Repeat Every": "1",
    "Start Date": "2026-01-01",
    "End Date": "",
    "From Account": "Checking",
    "To Account": "Savings",
    Notes: "auto transfer",
    Tag: "Base",
  },
  {
    Include: "",
    "Rule ID": "TRN-2",
    Tag: "Alt",
  },
];

const mapped = mapTransferReaderRows(rows, {
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
  normalizeTransferType: (v) => String(v || ""),
});

assert.equal(mapped.length, 1);
assert.equal(mapped[0].ruleId, "TRN-1");
assert.equal(mapped[0].scenarioId, "Base");
assert.equal(mapped[0].amount, 250);
assert.equal(mapped[0].paidFrom, "Checking");
assert.equal(mapped[0].paidTo, "Savings");
assert.equal(mapped[0].type, "Transfer");
assert.equal(mapped[0].behavior, "Transfer");
