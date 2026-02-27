import assert from "node:assert/strict";

import { buildAccountLookupMap } from "../ts/core/accountLookupMap";

const map = buildAccountLookupMap(
  [
    { name: "Cash", forecast: true },
    { name: "cash", forecast: false },
    { name: "Card", forecast: true },
  ],
  (v) => String(v || "").toLowerCase(),
);

assert.deepEqual(Object.keys(map).sort(), ["card", "cash"]);
assert.equal(map.cash.forecast, true);
