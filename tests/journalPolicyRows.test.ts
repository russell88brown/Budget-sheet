import assert from "node:assert/strict";

import { validatePolicyRows } from "../ts/core/journalPolicyRows";

const rows = [
  [true, "Base", "Auto Deficit Cover", "Policy A", 1, "2026-01-01", "", "cash", "card", 0, 10],
  [true, "Base", "Invalid", "Policy B", "", "", "", "cash", "card", 0, 10],
  [true, "Base", "Auto Deficit Cover", "", "", "", "", "cash", "card", 0, 10],
  [true, "Base", "Auto Deficit Cover", "Policy C", "", "", "", "", "card", 0, 10],
];

const result = validatePolicyRows({
  rows,
  idx: {
    include: 0,
    scenario: 1,
    type: 2,
    name: 3,
    priority: 4,
    start: 5,
    end: 6,
    trigger: 7,
    funding: 8,
    threshold: 9,
    maxPerEvent: 10,
  },
  defaultScenarioId: "Base",
  autoDeficitCoverPolicyType: "Auto Deficit Cover",
  toBoolean: (value) => value === true,
  normalizePolicyType: (value) => String(value || ""),
  normalizeScenarioId: (value) => String(value || "Base"),
  normalizeAccountLookupKey: (value) => String(value || "").trim().toLowerCase(),
  hasValidAccountForScenario: (scenarioId, accountKey) =>
    scenarioId === "Base" && (accountKey === "cash" || accountKey === "card"),
  toNumber: (value) => {
    if (value === null || value === undefined || value === "") {
      return null;
    }
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  },
  toPositiveInt: (value) => {
    if (value === null || value === undefined || value === "") {
      return null;
    }
    const num = Number(value);
    if (!Number.isFinite(num) || num < 1) {
      return null;
    }
    return Math.floor(num);
  },
  toDate: (value) => {
    if (!value) {
      return null;
    }
    const date = new Date(String(value));
    return Number.isNaN(date.getTime()) ? null : date;
  },
});

assert.equal(result.updated, 3);
assert.equal(result.rows[0][0], true);
assert.equal(result.rows[1][0], false);
assert.equal(result.rows[2][0], false);
assert.equal(result.rows[3][0], false);

// Source rows must remain unchanged.
assert.equal(rows[1][0], true);
