import assert from "node:assert/strict";

import { composeRunLogNotes } from "../ts/core/runLogNotes";

assert.equal(
  composeRunLogNotes({
    scenarioValidation: { totalDisabled: 2 },
    coreValidation: { totalDisabled: 3 },
    explicitNote: "manual note",
  }),
  "Disabled unknown tag rows: 2 | Disabled invalid core rows: 3 | manual note",
);

assert.equal(composeRunLogNotes({ explicitNote: "only note" }), "only note");
assert.equal(composeRunLogNotes({}), "");
