import assert from "node:assert/strict";

import {
  buildScenarioLookup,
  filterByScenario,
  filterByScenarioSet,
  normalizeScenarioSet,
  shouldIncludeScenarioColumn,
} from "../ts/core/tagScope";

assert.deepEqual(normalizeScenarioSet("Stress"), ["Stress"]);
assert.deepEqual(normalizeScenarioSet(["Stress", "Base", "Stress"]), ["Stress", "Base"]);
assert.deepEqual(normalizeScenarioSet([]), ["Base"]);

const rows = [
  { scenarioId: "Base", id: 1 },
  { scenarioId: "Stress", id: 2 },
  { scenarioId: "", id: 3 },
];
assert.deepEqual(
  filterByScenario(rows, "Base").map((row) => row.id),
  [1, 3]
);
assert.deepEqual(
  filterByScenarioSet(rows, ["Stress", "Base"]).map((row) => row.id),
  [1, 2, 3]
);
assert.deepEqual(
  filterByScenarioSet(rows, "Stress").map((row) => row.id),
  [2]
);

const lookup = buildScenarioLookup(["Stress"]);
assert.equal(lookup.Stress, true);
assert.equal(lookup.Base, true);

assert.equal(shouldIncludeScenarioColumn(2, ["Base"]), false);
assert.equal(shouldIncludeScenarioColumn(2, ["Base", "Stress"]), true);
assert.equal(shouldIncludeScenarioColumn(-1, ["Base", "Stress"]), false);
