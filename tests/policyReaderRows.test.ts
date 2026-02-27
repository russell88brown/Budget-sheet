import assert from "node:assert/strict";

import { mapPolicyReaderRows } from "../ts/core/policyReaderRows";

const rows = [
  {
    Include: "TRUE",
    "Rule ID": "POL-1",
    "Policy Type": "Auto Deficit Cover",
    Name: "Cover Checking",
    Priority: "",
    "Start Date": "2026-01-01",
    "End Date": "",
    "Trigger Account": "Checking",
    "Funding Account": "Savings",
    Threshold: "",
    "Max Per Event": "250",
    Notes: "primary",
    Tag: "Base",
  },
  {
    Include: "",
    "Rule ID": "POL-2",
    Tag: "Alt",
  },
];

const mapped = mapPolicyReaderRows(rows, {
  toBoolean: (v) => v === true || v === "TRUE",
  normalizeScenario: (v) => String(v || "Base"),
  getTagValue: (row) => row.Tag,
  normalizePolicyType: (v) => String(v || ""),
  toPositiveInt: (v) => {
    const n = Number(v);
    return Number.isInteger(n) && n > 0 ? n : null;
  },
  toDate: (v) => {
    if (!v) {
      return null;
    }
    const d = new Date(String(v));
    return Number.isNaN(d.getTime()) ? null : d;
  },
  toNumber: (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  },
});

assert.equal(mapped.length, 1);
assert.equal(mapped[0].ruleId, "POL-1");
assert.equal(mapped[0].scenarioId, "Base");
assert.equal(mapped[0].priority, 100);
assert.equal(mapped[0].threshold, 0);
assert.equal(mapped[0].maxPerEvent, 250);
