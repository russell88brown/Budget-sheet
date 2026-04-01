import assert from "node:assert/strict";

import { validateGoalRows } from "../ts/core/journalGoalRows";

const result = validateGoalRows({
  rows: [
    [true, "Base", "Emergency", 5000, "2026-12-31", 1, "cash", "Fixed Amount", 250, ""],
    [true, "Base", "", 1000, "2026-12-31", "", "cash", "Fixed Amount", 100, ""],
    [true, "Base", "Holiday", -10, "2026-12-31", "", "cash", "Leftover", "", ""],
    [true, "Base", "Deposit", 1000, "", "", "cash", "Percent of Inflow", "", 0],
  ],
  idx: {
    include: 0,
    scenario: 1,
    name: 2,
    targetAmount: 3,
    targetDate: 4,
    priority: 5,
    fundingAccount: 6,
    fundingPolicy: 7,
    amountPerMonth: 8,
    percentOfInflow: 9,
  },
  defaultScenarioId: "Base",
  goalFundingPolicies: {
    FIXED: "Fixed Amount",
    LEFTOVER: "Leftover",
    PERCENT: "Percent of Inflow",
  },
  toBoolean: (value) => value === true,
  normalizeScenarioId: (value) => String(value || "Base"),
  normalizeAccountLookupKey: (value) => String(value || "").trim().toLowerCase(),
  hasValidAccountForScenario: (scenarioId, accountKey) =>
    scenarioId === "Base" && accountKey === "cash",
  toNumber: (value) => {
    if (value === null || value === undefined || value === "") {
      return null;
    }
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  },
  toDate: (value) => {
    if (!value) {
      return null;
    }
    const date = new Date(String(value));
    return Number.isNaN(date.getTime()) ? null : date;
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
});

assert.equal(result.updated, 3);
assert.equal(result.rows[0][0], true);
assert.equal(result.rows[1][0], false);
assert.equal(result.rows[2][0], false);
assert.equal(result.rows[3][0], false);
