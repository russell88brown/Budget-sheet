import assert from "node:assert/strict";

import { buildJournalArtifactsForRunModel } from "../ts/core/journalBuild";

const model = {
  scenarioId: "Stress",
  accounts: [{ name: "Cash", type: "Cash" }],
};

let asserted = false;
const artifacts = buildJournalArtifactsForRunModel(model, {
  resolveScenarioId: (scenarioId: unknown) => String(scenarioId || "Base"),
  assertUniqueScenarioAccountNames: () => {
    asserted = true;
  },
  buildAccountTypeMap: () => ({ Cash: "Cash" }),
  buildRunExtensions: () => ({ policies: [{ ruleId: "POL_1" }] }),
  buildSortedEvents: () => [{ kind: "Income", name: "Pay" }],
  applyEventsToJournal: (options) => ({
    rows: [[options.scenarioId, "row"]],
    forecastAccounts: ["Cash"],
  }),
});

assert.equal(asserted, true);
assert.deepEqual(artifacts, {
  rows: [["Stress", "row"]],
  forecastAccounts: ["Cash"],
  accountTypes: { Cash: "Cash" },
  scenarioId: "Stress",
});
