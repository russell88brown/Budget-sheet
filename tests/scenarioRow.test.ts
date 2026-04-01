import assert from "node:assert/strict";

import { isRowInActiveScenario } from "../ts/core/scenarioRow";

assert.equal(
  isRowInActiveScenario(["Base"], 0, "Base", "Base", (v) => String(v || "Base")),
  true,
);
assert.equal(
  isRowInActiveScenario(["Stress"], 0, "Base", "Base", (v) => String(v || "Base")),
  false,
);
assert.equal(
  isRowInActiveScenario([], -1, "Base", "Base", (v) => String(v || "Base")),
  true,
);
