import assert from "node:assert/strict";

import {
  resolveJournalScenarioId,
  shouldUseEngineDirect,
} from "../ts/core/journalRuntime";

assert.equal(resolveJournalScenarioId(" Stress ", (value) => String(value || "").trim()), "Stress");

assert.equal(shouldUseEngineDirect(["Base"], true), true);
assert.equal(shouldUseEngineDirect(["Base", "Stress"], true), false);
assert.equal(shouldUseEngineDirect(["Base"], false), false);
