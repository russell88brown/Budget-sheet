import assert from "node:assert/strict";

import { TypedBudget } from "../ts/apps-script/entry";

const required = [
  "getEventSortOrder",
  "compareCompiledEvents",
  "resolveTransferAmount",
  "normalizeTransferType",
  "expandRecurrence",
  "isPolicyActiveOnDate",
  "getApplicableAutoDeficitPolicies",
  "normalizeScenarioSet",
  "computeSeriesStats",
];

for (const key of required) {
  assert.equal(typeof (TypedBudget as Record<string, unknown>)[key], "function", key);
}
