import assert from "node:assert/strict";

import { mapSheetRows } from "../ts/core/sheetRows";

const rows = mapSheetRows(
  ["A", "B"],
  [
    ["x", 1],
    ["", null],
    [false, ""],
  ],
);

assert.deepEqual(rows, [{ A: "x", B: 1 }]);
