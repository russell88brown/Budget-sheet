import assert from "node:assert/strict";

import { formatDuplicateAccountErrorMessage } from "../ts/core/accountDuplicateError";

const msg = formatDuplicateAccountErrorMessage("Base", ["Cash", "Cash", "Card"], (v) => String(v));
assert.equal(msg, 'Duplicate account names in tag "Base": Cash, Card.');
