import assert from "node:assert/strict";

import { buildMultiRunJournalPayload } from "../ts/core/journalMultiRun";

const payload = buildMultiRunJournalPayload(["Base", "Stress"], 8, {
  buildRunModelForId: (scenarioId: string) => ({ scenarioId }),
  buildJournalArtifactsForRunModel: (runModel: any) => ({
    rows: [[runModel.scenarioId, "row"]],
    forecastAccounts: runModel.scenarioId === "Base" ? ["Cash"] : ["Cash", "Card"],
    accountTypes: runModel.scenarioId === "Base" ? { Cash: "Cash" } : { Card: "Credit" },
  }),
  mergeJournalArtifacts: (artifacts: any[]) => ({
    combinedRows: artifacts.map((a) => a.rows[0]),
    forecastAccounts: ["Cash", "Card"],
    accountTypes: { Cash: "Cash", Card: "Credit" },
  }),
});

assert.equal(payload.artifacts.length, 2);
assert.deepEqual(payload.combinedRows, [["Base", "row"], ["Stress", "row"]]);
assert.deepEqual(payload.forecastAccounts, ["Cash", "Card"]);
assert.deepEqual(payload.accountTypes, { Cash: "Cash", Card: "Credit" });
