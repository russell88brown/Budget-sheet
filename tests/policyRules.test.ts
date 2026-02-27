import assert from "node:assert/strict";

import {
  getApplicableAutoDeficitPolicies,
  isPolicyActiveOnDate,
} from "../ts/core/policyRules";

const normalizeDate = (value: unknown) => {
  const d = new Date(value as string | number | Date);
  d.setHours(0, 0, 0, 0);
  return d;
};

assert.equal(
  isPolicyActiveOnDate(
    { startDate: "2026-01-01", endDate: "2026-01-31" },
    "2026-01-15",
    normalizeDate
  ),
  true
);
assert.equal(
  isPolicyActiveOnDate(
    { startDate: "2026-01-10", endDate: "2026-01-31" },
    "2026-01-05",
    normalizeDate
  ),
  false
);

const policies = getApplicableAutoDeficitPolicies(
  [
    {
      ruleId: "p1",
      type: "Auto Deficit Cover",
      triggerAccount: "Cash",
      priority: 20,
      name: "Later",
      startDate: "2026-01-01",
    },
    {
      ruleId: "p2",
      type: "Auto Deficit Cover",
      triggerAccount: "Cash",
      priority: 10,
      name: "Sooner",
      startDate: "2026-01-01",
    },
    {
      ruleId: "p3",
      type: "Other",
      triggerAccount: "Cash",
      priority: 1,
      name: "Wrong type",
      startDate: "2026-01-01",
    },
  ],
  { from: "Cash", date: "2026-01-20" },
  {
    autoDeficitCoverType: "Auto Deficit Cover",
    normalizeAccountLookupKey: (value: unknown) => String(value || "").trim().toLowerCase(),
    toPositiveInt: (value: unknown) => {
      const n = Number(value);
      if (!Number.isFinite(n) || n < 1) {
        return null;
      }
      return Math.floor(n);
    },
    normalizeDate,
  }
);

assert.equal(policies.length, 2);
assert.equal(policies[0].ruleId, "p2");
assert.equal(policies[1].ruleId, "p1");
