import assert from "node:assert/strict";

import {
  normalizeFrequency,
  normalizePolicyType,
  normalizeRecurrence,
  normalizeTransferType,
  toBoolean,
  toDate,
  toNumber,
  toPositiveInt,
} from "../ts/core/readerNormalization";

const frequencies = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
  ONCE: "Once",
};

const transferTypes = {
  REPAYMENT_AMOUNT: "Repayment - Amount",
  REPAYMENT_ALL: "Repayment - All",
  TRANSFER_AMOUNT: "Transfer - Amount",
  TRANSFER_EVERYTHING_EXCEPT: "Transfer - Everything Except",
};

const policyTypes = {
  AUTO_DEFICIT_COVER: "Auto Deficit Cover",
};

assert.equal(toBoolean(true), true);
assert.equal(toBoolean("TRUE"), true);
assert.equal(toBoolean(0), false);

assert.equal(toNumber("10.5"), 10.5);
assert.equal(toNumber(""), null);
assert.equal(toNumber("abc"), null);

assert.equal(toDate(""), null);
const parsedDate = toDate("2026-01-03");
assert.ok(parsedDate instanceof Date);

assert.equal(toPositiveInt(3.7), 3);
assert.equal(toPositiveInt(0), null);

const monthly = normalizeFrequency("monthly", frequencies);
assert.equal(monthly.frequency, frequencies.MONTHLY);
assert.equal(monthly.repeatEvery, null);
assert.equal(monthly.isSingleOccurrence, false);

const once = normalizeFrequency("one-off", frequencies);
assert.equal(once.frequency, frequencies.ONCE);
assert.equal(once.repeatEvery, 1);
assert.equal(once.isSingleOccurrence, true);

const recurrence = normalizeRecurrence("annually", "", "2026-01-01", "", frequencies);
assert.equal(recurrence.frequency, frequencies.YEARLY);
assert.equal(recurrence.repeatEvery, 1);
assert.ok(recurrence.startDate instanceof Date);

const repaymentLegacy = normalizeTransferType("repayment", 0, transferTypes);
assert.equal(repaymentLegacy, transferTypes.REPAYMENT_ALL);

const transferLegacy = normalizeTransferType("transfer", 50, transferTypes);
assert.equal(transferLegacy, transferTypes.TRANSFER_AMOUNT);

const policy = normalizePolicyType("auto deficit cover", policyTypes);
assert.equal(policy, policyTypes.AUTO_DEFICIT_COVER);
