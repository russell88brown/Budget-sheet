import assert from "node:assert/strict";

import { executeJournalPipelineCore } from "../ts/core/journalPipelineExecution";

let refreshed = 0;
const result = executeJournalPipelineCore("Base", null, true, {
  buildRunModelWithExtensions: (scenarioId: string) => ({ scenarioId, accounts: [] }),
  refreshAccountSummariesForRunModel: () => {
    refreshed += 1;
  },
  buildJournalArtifactsForRunModel: (runModel: any) => ({
    rows: [[runModel.scenarioId]],
    forecastAccounts: [],
    accountTypes: {},
    scenarioId: runModel.scenarioId,
  }),
});

assert.equal(refreshed, 1);
assert.equal(result.runModel.scenarioId, "Base");
assert.deepEqual(result.journalData.rows, [["Base"]]);
