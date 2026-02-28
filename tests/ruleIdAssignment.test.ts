import assert from "node:assert/strict";

import {
  assignMissingRuleIdsRows,
  hasMeaningfulRowDataForRuleId,
} from "../ts/core/ruleIdAssignment";

assert.equal(hasMeaningfulRowDataForRuleId(["", "", false], 1), false);
assert.equal(hasMeaningfulRowDataForRuleId(["Name", "", false], 1), true);

const sourceRows = [
  ["TRUE", "INC-00001", "Salary", 100],
  ["TRUE", "", "", ""],
  ["TRUE", "", "Bonus", 50],
  ["TRUE", "", "Freelance", 80],
];

const result = assignMissingRuleIdsRows(sourceRows, 1, "INC");
assert.equal(result.assigned, 3);
assert.equal(result.rows[0][1], "INC-00001");
assert.equal(result.rows[1][1], "INC-00002");
assert.equal(result.rows[2][1], "INC-00003");
assert.equal(result.rows[3][1], "INC-00004");

// Ensure original source rows are not mutated.
assert.equal(sourceRows[2][1], "");
