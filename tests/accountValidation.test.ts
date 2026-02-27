import assert from "node:assert/strict";

import { findDuplicateAccountNames } from "../ts/core/accountValidation";

const normalizeAccountLookupKey = (value: unknown) => String(value || "").trim().toLowerCase();

const duplicates = findDuplicateAccountNames(
  [{ name: "Checking" }, { name: "Savings" }, { name: " checking " }, { name: "Checking" }],
  normalizeAccountLookupKey
);
assert.deepEqual(duplicates, ["checking", "Checking"]);

const noDuplicates = findDuplicateAccountNames(
  [{ name: "Offset" }, { name: "Bills" }],
  normalizeAccountLookupKey
);
assert.deepEqual(noDuplicates, []);
