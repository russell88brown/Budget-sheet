import assert from "node:assert/strict";

import { buildRunLogEntryRow } from "../ts/core/runLogEntry";

const now = new Date("2026-02-28T12:00:00.000Z");
const row = buildRunLogEntryRow(now, "", "Base", null, "note");

assert.equal(row[0], now);
assert.equal(row[1], "Run");
assert.equal(row[2], "Base");
assert.equal(row[3], "");
assert.equal(row[4], "note");
