import assert from "node:assert/strict";

import {
  buildJournalRowsRuntime,
  resolveJournalScenarioId,
  shouldUseEngineDirect,
} from "../ts/core/journalRuntime";

assert.equal(resolveJournalScenarioId(" Stress ", (value) => String(value || "").trim()), "Stress");

const rows = buildJournalRowsRuntime(
  [{ name: "Cash" }],
  [{ kind: "Income" }],
  [{ type: "AUTO_DEFICIT_COVER" }],
  "Base",
  "Base",
  (options) => ({ rows: [[options.scenarioId]], forecastAccounts: ["Cash"] })
);
assert.deepEqual(rows, { rows: [["Base"]], forecastAccounts: ["Cash"] });

assert.equal(shouldUseEngineDirect(["Base"], true), true);
assert.equal(shouldUseEngineDirect(["Base", "Stress"], true), false);
assert.equal(shouldUseEngineDirect(["Base"], false), false);
