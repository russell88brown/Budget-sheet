import assert from "node:assert/strict";

import { addDays, addMonthsClamped, normalizeDate } from "../ts/core/dateMath";

const date = normalizeDate("2026-03-10T18:45:00.000Z");
assert.equal(date.getHours(), 0);
assert.equal(date.getMinutes(), 0);
assert.equal(date.getSeconds(), 0);
assert.equal(date.getMilliseconds(), 0);

const plusDays = new Date(2026, 1, 10);
const next = addDays(plusDays, 7);
assert.equal(next.getDate(), 17);
assert.equal(next.getMonth(), 1);

const jan31 = new Date(2026, 0, 31);
const feb = addMonthsClamped(jan31, 1);
assert.equal(feb.getFullYear(), 2026);
assert.equal(feb.getMonth(), 1);
assert.equal(feb.getDate(), 28);
