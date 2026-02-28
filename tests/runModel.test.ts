import assert from "node:assert/strict";

import {
  buildRunModel,
  buildRunModelWithExtensions,
  filterScenarioRowsForModel,
} from "../ts/core/runModel";

const normalizeScenario = (value: unknown): string => {
  if (value === null || value === undefined || String(value).trim() === "") {
    return "Base";
  }
  const cleaned = String(value).trim();
  return cleaned.toLowerCase() === "base" ? "Base" : cleaned;
};

const sourceRows = [
  { scenarioId: "Base", name: "A" },
  { scenarioId: "Stress", name: "B" },
  { name: "NoScenario" },
];

assert.deepEqual(
  filterScenarioRowsForModel(sourceRows, "Base", normalizeScenario, "Base").map((row) => row.name),
  ["A", "NoScenario"],
);

const sources = {
  accounts: [
    { scenarioId: "Base", name: "Cash" },
    { scenarioId: "Base", name: "" },
    { scenarioId: "Stress", name: "Cash Stress" },
  ],
  incomeRules: sourceRows,
  transferRules: sourceRows,
  expenseRules: sourceRows,
  policies: sourceRows,
  goals: sourceRows,
};

const core = buildRunModel("Base", sources, normalizeScenario, "Base");
assert.equal(core.scenarioId, "Base");
assert.deepEqual(core.accounts.map((row) => row.name), ["Cash"]);
assert.deepEqual(core.incomeRules.map((row) => row.name), ["A", "NoScenario"]);

const extended = buildRunModelWithExtensions("Stress", sources, normalizeScenario, "Base");
assert.equal(extended.scenarioId, "Stress");
assert.deepEqual(extended.policies.map((row) => row.name), ["B"]);
assert.deepEqual(extended.goals.map((row) => row.name), ["B"]);
