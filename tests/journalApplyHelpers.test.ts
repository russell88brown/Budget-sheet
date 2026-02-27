import assert from "node:assert/strict";

import {
  buildAlerts,
  buildBalanceMap,
  buildForecastBalanceCells,
  buildForecastableMap,
} from "../ts/core/journalApplyHelpers";

const accountKey = (value: unknown) => String(value || "").trim().toLowerCase();
const roundMoney = (value: unknown) => Math.round(Number(value || 0) * 100) / 100;

const accounts = [
  { name: "Cash", balance: 100.111, forecast: true },
  { name: "Card", balance: -50, forecast: false },
];

assert.deepEqual(buildBalanceMap(accounts, accountKey, roundMoney), {
  cash: 100.11,
  card: -50,
});
assert.deepEqual(buildForecastableMap(accounts, accountKey), {
  cash: true,
  card: false,
});
assert.deepEqual(
  buildForecastBalanceCells({ cash: 90, card: -40 }, ["Cash", "Card", "Offset"], accountKey),
  [90, -40, 0]
);

assert.equal(buildAlerts(true, false, ""), "NEGATIVE_CASH");
assert.equal(buildAlerts(false, true, "CUSTOM"), "CREDIT_PAID_OFF | CUSTOM");
