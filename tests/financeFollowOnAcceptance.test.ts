import assert from "node:assert/strict";
import fs from "node:fs";
import { applyEventWithSnapshots } from "../ts/core/journalEventApplication";
import type { BudgetEvent } from "../ts/core/contracts";

// These synthetic domain oracles specify desired preprocessing. They do not
// implement it in the application or establish full forecast-engine acceptance.
type Balances = Record<string, number>;
type Payment = { transaction_id: string; status: string; date: string; from: string; to: string; amount_minor: number };
type Reminder = { message_id: string; bill_id: string; due_date: string; from: string; amount_minor: number };
type Booking = { booking_id: string; status: string; paid_date?: string; due_date?: string; included_in_opening: boolean; from: string; amount_minor: number };
type Common = { opening_balances: Balances; canonical_events: BudgetEvent[] };
type DuplicateExpected = { unique_count: number; balances: Balances; raw_module_balances: Balances };
type Case = Common & (
  | { id: "duplicate-posted-card-credit"; records: Payment[]; expected: DuplicateExpected }
  | { id: "repeated-bill-reminder"; records: Reminder[]; expected: DuplicateExpected }
  | { id: "notice-account-available-date"; accounts: Array<{name: string; balance: number; type: string; forecast: boolean}>; availability_overlay: Array<{account: string; available_date: string}>; expected: {balances: Balances; spendable_by_date: Record<string, number>; total_cash: number} }
  | { id: "paid-travel-in-opening-balance"; opening_date: string; records: Booking[]; expected: {paid_remaining_minor: number; remaining_minor: number; balances: Balances; raw_module_balances: Balances} }
);
type Fixture = { status: string; source_revision: string; currency: string; cases: Case[] };
const fixture: Fixture = JSON.parse(fs.readFileSync(new URL("./fixtures/finance-follow-on-cases.json", import.meta.url), "utf8"));
assert.equal(fixture.status, "synthetic-proposed-domain-contract");
assert.equal(fixture.source_revision, "07bfa140e8b2c3aec2fa3e34dc066dc54037a1e1");
assert.equal(fixture.currency, "AUD");
assert.deepEqual(fixture.cases.map(item => item.id).sort(), [
  "duplicate-posted-card-credit", "notice-account-available-date",
  "paid-travel-in-opening-balance", "repeated-bill-reminder",
]);

const ctx = {
  roundMoney: (value: unknown) => Math.round(Number(value || 0) * 100) / 100,
  accountKey: (value: unknown) => String(value || "").trim().toLowerCase(),
  cloneBalances: (balances: Balances) => ({ ...balances }),
  computeInterestAmount: () => { throw new Error("Interest is outside these cases"); },
  resolveTransferAmount: (_balances: Balances, _event: BudgetEvent, amount: number) => ({ amount, skip: amount <= 0 }),
};
function apply(initial: Balances, events: BudgetEvent[]): Balances {
  const balances = { ...initial };
  for (const event of events) applyEventWithSnapshots(balances, structuredClone(event), ctx);
  return balances;
}
function uniqueBy<T extends {amount_minor: number}>(records: T[], field: keyof T, valueFields: Array<keyof T>): T[] {
  const seen = new Map<unknown, T>();
  for (const record of records) {
    assert.equal(typeof record[field], "string");
    assert.match(String(record[field]), /^SYN-/);
    assert.ok(Number.isSafeInteger(record.amount_minor) && record.amount_minor >= 0);
    const prior = seen.get(record[field]);
    if (prior) {
      for (const key of valueFields) assert.deepEqual(record[key], prior[key], `conflicting duplicate ${String(field)}`);
    } else seen.set(record[field], record);
  }
  return [...seen.values()];
}
const paymentEvent = (record: Payment): BudgetEvent => ({kind: "Transfer", name: "Synthetic card payment", date: record.date, from: record.from, to: record.to, amount: record.amount_minor / 100, sourceRuleId: record.transaction_id});
const billEvent = (record: Reminder): BudgetEvent => ({kind: "Expense", name: "Synthetic bill obligation", date: record.due_date, from: record.from, amount: record.amount_minor / 100, sourceRuleId: record.bill_id});
const bookingEvent = (record: Booking): BudgetEvent => ({kind: "Expense", name: "Synthetic unpaid booking", date: record.due_date, from: record.from, amount: record.amount_minor / 100, sourceRuleId: record.booking_id});

for (const item of fixture.cases) {
  let canonical: BudgetEvent[];
  let raw: BudgetEvent[] | undefined;
  if (item.id === "duplicate-posted-card-credit") {
    assert.ok(item.records.every(record => record.status === "posted"));
    const records = uniqueBy(item.records, "transaction_id", ["status", "date", "from", "to", "amount_minor"]);
    assert.equal(records.length, item.expected.unique_count);
    canonical = records.map(paymentEvent);
    raw = item.records.map(paymentEvent);
    assert.throws(() => uniqueBy([item.records[0], {...item.records[0], amount_minor: 12600}], "transaction_id", ["amount_minor"]), /conflicting duplicate/);
  } else if (item.id === "repeated-bill-reminder") {
    const records = uniqueBy(item.records, "bill_id", ["due_date", "from", "amount_minor"]);
    assert.equal(records.length, item.expected.unique_count);
    assert.equal(new Set(item.records.map(record => record.message_id)).size, 2);
    canonical = records.map(billEvent);
    raw = item.records.map(billEvent);
    assert.throws(() => uniqueBy([item.records[0], {...item.records[0], due_date: "2030-04-07"}], "bill_id", ["due_date"]), /conflicting duplicate/);
  } else if (item.id === "notice-account-available-date") {
    canonical = []; // Release affects availability; it does not create income.
    const accountBalances = Object.fromEntries(item.accounts.map(a => [a.name.toLowerCase(), a.balance]));
    assert.deepEqual(accountBalances, item.opening_balances);
    assert.equal(Object.values(item.opening_balances).reduce((sum, n) => sum + n, 0), item.expected.total_cash);
    assert.equal(new Set(item.availability_overlay.map(a => a.account)).size, item.availability_overlay.length);
    for (const entry of item.availability_overlay) {
      assert.ok(Object.prototype.hasOwnProperty.call(item.opening_balances, entry.account));
      assert.match(entry.available_date, /^\d{4}-\d{2}-\d{2}$/);
    }
    for (const [date, expected] of Object.entries(item.expected.spendable_by_date)) {
      // Proposed policy oracle only; not a BudgetAccount feature.
      const spendable = item.availability_overlay.filter(a => a.available_date <= date)
        .reduce((sum, a) => sum + item.opening_balances[a.account], 0);
      assert.equal(spendable, expected);
    }
  } else {
    const paid = item.records.filter(r => r.status === "paid" && r.included_in_opening);
    assert.equal(paid.length, 1);
    assert.ok(paid[0].paid_date && paid[0].paid_date < item.opening_date);
    assert.equal(item.expected.paid_remaining_minor, 0);
    const remaining = item.records.filter(r => r.status === "committed" && !r.included_in_opening);
    assert.equal(paid.length + remaining.length, item.records.length, "unclassified travel record");
    assert.equal(remaining.reduce((sum, r) => sum + r.amount_minor, 0), item.expected.remaining_minor);
    for (const record of remaining) assert.ok(record.due_date && record.due_date >= item.opening_date);
    canonical = remaining.map(bookingEvent);
    // Deliberately wrong projection: issuing every record again demonstrates
    // double deduction only, not a date-window or recurrence test.
    raw = item.records.map(bookingEvent);
  }
  assert.deepEqual(canonical, item.canonical_events, `${item.id}: full event projection`);
  assert.deepEqual(apply(item.opening_balances, canonical), item.expected.balances, `${item.id}: canonical application`);
  if (raw && "raw_module_balances" in item.expected) {
    assert.deepEqual(apply(item.opening_balances, raw), item.expected.raw_module_balances, `${item.id}: raw application`);
    assert.notDeepEqual(item.expected.raw_module_balances, item.expected.balances);
  }
}
console.log("PASS four proposed finance domain oracles and bounded existing-engine projections; full-engine acceptance not run.");
