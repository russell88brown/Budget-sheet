import assert from "node:assert/strict";

import {
  getJournalBaseColumnCount,
  normalizeJournalRunIds,
} from "../ts/core/journalOrchestration";

const normalizeTag = (value: unknown) => {
  const text = String(value || "").trim();
  return text || "Base";
};

assert.deepEqual(normalizeJournalRunIds(undefined, "Base", normalizeTag), ["Base"]);
assert.deepEqual(normalizeJournalRunIds(["", "Stress", "Stress"], "Base", normalizeTag), [
  "Base",
  "Stress",
]);

const outputs = [
  { name: "NotJournal", columns: [{ name: "A" }] },
  { name: "Journal", columns: [{ name: "Date" }, { name: "Tag" }, { name: "Amount" }] },
];
assert.equal(getJournalBaseColumnCount(outputs, "Journal", 8), 3);
assert.equal(getJournalBaseColumnCount([], "Journal", 8), 8);
