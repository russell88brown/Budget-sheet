import assert from "node:assert/strict";

import {
  buildAccountLookupFromRows,
  validateAccountsRows,
} from "../ts/core/journalAccountRows";

const rows = [
  [true, "Cash", "Base", "Cash", 100],
  [true, "Card", "Base", "Credit", -50],
  [true, "Cash", "Stress", "Cash", 200],
  [false, "Ignored", "Base", "Cash", 1],
];

const lookup = buildAccountLookupFromRows({
  rows,
  includeIdx: 0,
  nameIdx: 1,
  scenarioIdx: 2,
  defaultScenarioId: "Base",
  toBoolean: (value) => value === true,
  normalizeScenarioId: (value) => String(value || "Base"),
  normalizeAccountLookupKey: (value) => String(value || "").trim().toLowerCase(),
});

assert.equal(lookup["card"], true);
assert.equal(lookup["Base|cash"], true);
assert.equal(lookup["Stress|cash"], true);
assert.equal(lookup["cash"], undefined);

const validateResult = validateAccountsRows({
  rows: [
    [true, "Cash", "Base", "Cash", 100],
    [true, "Cash", "Base", "Cash", 50],
    [true, "Savings", "Base", "Invalid", 20],
    [true, "Vault", "Base", "Cash", ""],
  ],
  includeIdx: 0,
  nameIdx: 1,
  scenarioIdx: 2,
  typeIdx: 3,
  balanceIdx: 4,
  defaultScenarioId: "Base",
  cashType: "Cash",
  creditType: "Credit",
  toBoolean: (value) => value === true,
  normalizeScenarioId: (value) => String(value || "Base"),
  normalizeAccountLookupKey: (value) => String(value || "").trim().toLowerCase(),
  normalizeAccountType: (value) => String(value || "").trim(),
  toNumber: (value) => {
    if (value === null || value === undefined || value === "") {
      return null;
    }
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  },
});

assert.equal(validateResult.updated, 3);
assert.equal(validateResult.rows[0][0], true);
assert.equal(validateResult.rows[1][0], false);
assert.equal(validateResult.rows[2][0], false);
assert.equal(validateResult.rows[3][0], false);
