import assert from "node:assert/strict";

import { applyAutoDeficitCoverRowsBeforeEvent } from "../ts/core/journalAutoDeficit";

const ctx = {
  getApplicableAutoDeficitPolicies: (policyRules: any[]) => policyRules,
  getDeficitCoverageNeedForEvent: () => ({ account: "Bills", amount: 70 }),
  accountKey: (value: unknown) => String(value || "").trim().toLowerCase(),
  roundMoney: (value: unknown) => Math.round(Number(value || 0) * 100) / 100,
  toNumber: (value: unknown): number | null => {
    if (value === "" || value === null || value === undefined) return null;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  },
  applyEventWithSnapshots: (balances: Record<string, number>, event: any) => {
    const from = String(event.from || "").toLowerCase();
    const to = String(event.to || "").toLowerCase();
    const amount = Number(event.amount || 0);
    balances[from] = (balances[from] || 0) - amount;
    balances[to] = (balances[to] || 0) + amount;
    return { afterFrom: { ...balances }, afterTo: { ...balances } };
  },
  buildJournalEventRows: (event: any) => [[event.name, event.amount, event.sourceRuleId]],
  autoDeficitCoverPolicyType: "AUTO_DEFICIT_COVER",
  transferAmountType: "TRANSFER_AMOUNT",
};

const balances = { reserve: 100, bills: 0 };
const rows = applyAutoDeficitCoverRowsBeforeEvent(
  balances,
  { kind: "Expense", from: "Bills", amount: 70 },
  { bills: "Cash" },
  [{ fundingAccount: "Reserve", name: "Cover Bills", ruleId: "POL_1" }],
  ["Reserve", "Bills"],
  "Base",
  ctx
);

assert.equal(rows.length, 1);
assert.deepEqual(rows[0], ["Cover Bills", 70, "POL_1"]);
assert.equal(balances.reserve, 30);
assert.equal(balances.bills, 70);
