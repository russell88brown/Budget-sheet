import assert from "node:assert/strict";

import { mapAccountReaderRows } from "../ts/core/accountReaderRows";

const rows = [
  {
    "Account Name": "Cash",
    Balance: "100",
    Type: "Cash",
    Include: "TRUE",
    "Interest Rate (APR %)": 12,
    "Interest Fee / Month": 3,
    "Interest Method": "APR",
    "Interest Frequency": "Monthly",
    "Interest Repeat Every": 1,
    "Interest Start Date": "2026-01-01",
    Tag: "Base",
  },
];

const mapped = mapAccountReaderRows(rows, {
  normalizeRecurrence: () => ({ frequency: "Monthly", repeatEvery: 1, startDate: new Date("2026-01-01") }),
  normalizeScenario: (v) => String(v || "Base"),
  getTagValue: (row) => row.Tag,
  toNumber: (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  },
  toBoolean: (v) => v === true || v === "TRUE",
});

assert.equal(mapped.length, 1);
assert.equal(mapped[0].name, "Cash");
assert.equal(mapped[0].balance, 100);
assert.equal(mapped[0].forecast, true);
assert.equal(mapped[0].scenarioId, "Base");
