import assert from "node:assert/strict";

import {
  assertAccountsShape,
  assertEventsShape,
  assertPoliciesShape,
} from "../ts/core/contracts";

assert.deepEqual(assertAccountsShape([{ name: "Cash" }]), [{ name: "Cash" }]);
assert.deepEqual(assertEventsShape([{ kind: "Income" }]), [{ kind: "Income" }]);
assert.deepEqual(assertPoliciesShape([{ type: "AUTO_DEFICIT_COVER" }]), [
  { type: "AUTO_DEFICIT_COVER" },
]);

assert.throws(() => assertAccountsShape({}), /Accounts payload/);
assert.throws(() => assertEventsShape({}), /Events payload/);
assert.throws(() => assertPoliciesShape({}), /Policies payload/);
