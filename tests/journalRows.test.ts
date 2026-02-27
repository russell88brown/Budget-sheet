import assert from "node:assert/strict";

import { buildJournalEventRows, buildOpeningRows } from "../ts/core/journalRows";

const accountKey = (value: unknown) => String(value || "").trim().toLowerCase();
const roundMoney = (value: unknown) => Math.round(Number(value || 0) * 100) / 100;
const buildAlerts = (cashNegative: boolean, creditPaidOff: boolean, explicitAlert: unknown) => {
  const alerts: string[] = [];
  if (cashNegative) alerts.push("NEGATIVE_CASH");
  if (creditPaidOff) alerts.push("CREDIT_PAID_OFF");
  if (explicitAlert) alerts.push(String(explicitAlert));
  return alerts.join(" | ");
};
const deriveJournalTransactionType = (event: any) => {
  if (!event || !event.kind) return "";
  if (event.kind === "Transfer" && event.behavior) return `Transfer (${event.behavior})`;
  return String(event.kind);
};
const buildForecastBalanceCells = (balances: Record<string, number>, forecastAccounts: string[]) =>
  forecastAccounts.map((name) => balances[accountKey(name)] || 0);

const ctx = {
  accountKey,
  roundMoney,
  buildAlerts,
  deriveJournalTransactionType,
  buildForecastBalanceCells,
  creditAccountType: "Credit",
};

const opening = buildOpeningRows(
  [{ name: "Cash", balance: 100 }],
  new Date(2026, 0, 1),
  ["Cash"],
  { cash: 100 },
  "Base",
  ctx
);
assert.equal(opening.length, 1);
assert.equal(opening[0][3], "Opening");
assert.equal(opening[0][5], 100);

const transferRows = buildJournalEventRows(
  {
    date: new Date(2026, 0, 2),
    kind: "Transfer",
    name: "Pay card",
    from: "Cash",
    to: "Card",
    behavior: "Repayment",
    amount: 20,
    appliedAmount: 20,
    sourceRuleId: "TRN_1",
  },
  { cash: 80, card: -50 },
  { cash: 80, card: -30 },
  ["Cash", "Card"],
  { cash: "Cash", card: "Credit" },
  "Base",
  ctx
);
assert.equal(transferRows.length, 2);
assert.equal(transferRows[0][5], -20);
assert.equal(transferRows[1][5], 20);
assert.equal(transferRows[1][3], "Transfer (Repayment)");

const incomeRows = buildJournalEventRows(
  {
    date: new Date(2026, 0, 3),
    kind: "Income",
    name: "Pay",
    to: "Cash",
    amount: 100,
    appliedAmount: 100,
  },
  { cash: 180 },
  { cash: 180 },
  ["Cash"],
  { cash: "Cash" },
  "Base",
  ctx
);
assert.equal(incomeRows.length, 1);
assert.equal(incomeRows[0][5], 100);
