import assert from "node:assert/strict";

import { listDuplicateAccountNames } from "../ts/core/accountNameDuplicates";

const duplicates = listDuplicateAccountNames(
  [{ name: "Cash" }, { name: "cash" }, { name: "Card" }, { name: "CARD" }],
  (v) => String(v || "").trim().toLowerCase(),
);

assert.deepEqual(duplicates.sort(), ["CARD", "cash"].sort());
