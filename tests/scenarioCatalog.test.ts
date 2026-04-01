import assert from "node:assert/strict";

import { buildScenarioCatalog } from "../ts/core/scenarioCatalog";

const values = [["Base"], ["Stress"], [""], ["base"]];
const result = buildScenarioCatalog(values, (v) => {
  const cleaned = String(v || "").trim();
  if (!cleaned) {
    return "Base";
  }
  if (cleaned.toLowerCase() === "base") {
    return "Base";
  }
  return cleaned;
}, "Base");

assert.deepEqual(result.sort(), ["Base", "Stress"]);
