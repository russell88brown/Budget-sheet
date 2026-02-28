import assert from "node:assert/strict";

import { buildRunExtensions } from "../ts/core/runExtensions";

const fromModel = buildRunExtensions({
  policies: [{ id: "P1" }],
  goals: [{ id: "G1" }],
});
assert.equal(fromModel.policies.length, 1);
assert.equal(fromModel.goals.length, 1);

const fallback = buildRunExtensions({ policies: "invalid", goals: null });
assert.deepEqual(fallback.policies, []);
assert.deepEqual(fallback.goals, []);
