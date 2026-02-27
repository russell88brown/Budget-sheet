import assert from "node:assert/strict";

import {
  buildAccountTypeMap,
  deriveJournalTransactionType,
  mergeJournalArtifacts,
} from "../ts/core/journalAssembly";

const accountTypes = buildAccountTypeMap([
  { name: "Cash", type: "Cash" },
  { name: "Card", type: "Credit" },
]);
assert.deepEqual(accountTypes, { Cash: "Cash", Card: "Credit" });

assert.equal(deriveJournalTransactionType({ kind: "Income" }), "Income");
assert.equal(deriveJournalTransactionType({ kind: "Transfer" }), "Transfer");
assert.equal(
  deriveJournalTransactionType({ kind: "Transfer", behavior: "Repayment" }),
  "Transfer (Repayment)"
);
assert.equal(deriveJournalTransactionType({ kind: "Interest" }), "Interest");

const merged = mergeJournalArtifacts(
  [
    {
      forecastAccounts: ["Cash", "Card"],
      accountTypes: { Cash: "Cash", Card: "Credit" },
      rows: [
        ["2026-01-01", "Base", "Cash", "Opening", "Opening Balance", 100, "", "", 100, -50],
      ],
    },
    {
      forecastAccounts: ["Card", "Savings"],
      accountTypes: { Savings: "Cash", Card: "Credit" },
      rows: [
        ["2026-01-02", "Base", "Savings", "Income", "Bonus", 30, "INC_1", "", -20, 30],
      ],
    },
  ],
  8
);

assert.deepEqual(merged.forecastAccounts, ["Cash", "Card", "Savings"]);
assert.deepEqual(merged.accountTypes, { Cash: "Cash", Card: "Credit", Savings: "Cash" });
assert.equal(merged.combinedRows.length, 2);
assert.deepEqual(merged.combinedRows[0].slice(8), [100, -50, ""]);
assert.deepEqual(merged.combinedRows[1].slice(8), ["", -20, 30]);
