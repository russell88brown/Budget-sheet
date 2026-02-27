import assert from "node:assert/strict";

import {
  compareCompiledEvents,
  normalizeCompiledEvent,
} from "../ts/core/compiledEvent";

const ctx = {
  roundMoney: (value: unknown) => Number(value ?? 0),
  normalizeDate: (value: unknown) => {
    const date = new Date(value as string | number | Date);
    date.setHours(0, 0, 0, 0);
    return date;
  },
  normalizeTag: (value: unknown) => String(value ?? "Base"),
  eventSortPriority: (event: Record<string, unknown>) => {
    if (event.kind === "Income") {
      return 0;
    }
    if (event.kind === "Expense") {
      return 1;
    }
    return 10;
  },
};

const normalized = normalizeCompiledEvent({ kind: "Income", amount: 10 }, 1, ctx);
assert.equal(normalized.id, "evt_1");
assert.equal(normalized.kind, "Income");
assert.equal(normalized.amount, 10);

const a = normalizeCompiledEvent({ id: "a", date: "2026-01-01", kind: "Income" }, 1, ctx);
const b = normalizeCompiledEvent({ id: "b", date: "2026-01-02", kind: "Income" }, 2, ctx);
assert.ok(compareCompiledEvents(a, b, ctx) < 0);

const c = normalizeCompiledEvent({ id: "c", date: "2026-01-01", kind: "Expense" }, 3, ctx);
assert.ok(compareCompiledEvents(a, c, ctx) < 0);

const sameDay = [
  { id: "evt_b", date: "2026-01-10", kind: "Income", sourceRuleId: "r1", name: "Bravo" },
  { id: "evt_c", date: "2026-01-10", kind: "Income", sourceRuleId: "r1", name: "Alpha" },
  { id: "evt_d", date: "2026-01-10", kind: "Income", sourceRuleId: "r0", name: "Zulu" },
  { id: "evt_a", date: "2026-01-10", kind: "Income", sourceRuleId: "r1", name: "Alpha" },
  { date: "2026-01-10", kind: "Income", sourceRuleId: "r1", name: "Alpha" },
].map((event, index) => normalizeCompiledEvent(event, index + 1, ctx));

assert.equal(sameDay[4].id, "evt_5");

const sorted = [...sameDay].sort((left, right) => compareCompiledEvents(left, right, ctx));
assert.deepEqual(
  sorted.map((event) => event.id),
  ["evt_d", "evt_5", "evt_a", "evt_c", "evt_b"]
);
