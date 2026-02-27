import assert from "node:assert/strict";

import {
  isValidAccountSummaryNumber,
  isValidNumberOrBlank,
  mapLegacyFrequency,
  normalizeAccountType,
  normalizeInterestFrequency,
  normalizeInterestMethod,
} from "../ts/core/journalNormalization";

const FREQUENCIES = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
  ONCE: "Once",
};

const INTEREST_METHODS = {
  APR_SIMPLE: "APR_SIMPLE",
  APY_COMPOUND: "APY_COMPOUND",
};

const ACCOUNT_TYPES = {
  CASH: "Cash",
  CREDIT: "Credit",
};

const mapped = mapLegacyFrequency("biweekly", "", null, null, FREQUENCIES);
assert.equal(mapped.frequency, FREQUENCIES.WEEKLY);
assert.equal(mapped.repeatEvery, 2);

const once = mapLegacyFrequency("once", "", new Date(2026, 0, 5), "", FREQUENCIES);
assert.equal(once.frequency, FREQUENCIES.ONCE);
assert.equal(once.repeatEvery, 1);
assert.equal((once.endDate as Date).getTime(), new Date(2026, 0, 5).getTime());

assert.equal(normalizeInterestMethod("apy_compound", INTEREST_METHODS), "APY_COMPOUND");
assert.equal(normalizeInterestMethod("invalid", INTEREST_METHODS), "");
assert.equal(normalizeInterestFrequency("monthly", FREQUENCIES), "Monthly");
assert.equal(normalizeInterestFrequency("none", FREQUENCIES), "");
assert.equal(normalizeAccountType("credit", ACCOUNT_TYPES), "Credit");
assert.equal(normalizeAccountType("Offset", ACCOUNT_TYPES), "Offset");

const toNumber = (value: unknown): number | null => {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

assert.equal(isValidNumberOrBlank("", toNumber), true);
assert.equal(isValidNumberOrBlank("12.3", toNumber), true);
assert.equal(isValidNumberOrBlank("abc", toNumber), false);

assert.equal(isValidAccountSummaryNumber(""), true);
assert.equal(isValidAccountSummaryNumber(4.2), true);
assert.equal(isValidAccountSummaryNumber(NaN), false);
