import assert from "node:assert/strict";

import {
  DEFAULT_TAG,
  getTagColumnIndex,
  normalizeActions,
  normalizeAvailableTags,
  normalizeTag,
  selectRunTags,
} from "../ts/engine/runSelections";

assert.equal(normalizeTag(null), DEFAULT_TAG);
assert.equal(normalizeTag(undefined), DEFAULT_TAG);
assert.equal(normalizeTag(""), DEFAULT_TAG);
assert.equal(normalizeTag(" base "), DEFAULT_TAG);

const tags = normalizeAvailableTags(["Stress", "Base", "stress", "", null]);
assert.ok(tags.includes("Base"));
assert.ok(tags.includes("Stress"));

const actions = normalizeActions(["journal", "daily", "JOURNAL"]);
assert.deepEqual(actions, ["journal", "daily"]);

assert.throws(() => normalizeActions(["invalid"]), /Unknown action type/);

const selectedTags = selectRunTags(["Base", "Stress"], ["Stress"]);
assert.deepEqual(selectedTags, ["Stress", "Base"]);

assert.throws(() => selectRunTags(["Base"], ["Stress"]), /Unknown tag "Stress"/);

assert.equal(getTagColumnIndex(["Date", "Tag", "Amount"]), 1);
assert.equal(getTagColumnIndex(["Date", "Scenario", "Amount"]), -1);
assert.equal(getTagColumnIndex(["Date", "Amount"]), -1);
