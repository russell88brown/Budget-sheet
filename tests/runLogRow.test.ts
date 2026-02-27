import assert from "node:assert/strict";

import { resolveRunLogWriteRow } from "../ts/core/runLogRow";

assert.deepEqual(resolveRunLogWriteRow([["x"], ["y"], [""]], 2, 10), {
  row: 4,
  insertAfterMax: false,
});

assert.deepEqual(resolveRunLogWriteRow([["x"], ["y"]], 2, 3), {
  row: 4,
  insertAfterMax: true,
});
