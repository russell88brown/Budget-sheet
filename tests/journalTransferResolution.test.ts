import assert from "node:assert/strict";

import { resolveTransferAmountForJournalWithDefault } from "../ts/core/journalTransferResolution";

const marked: string[] = [];
const markCreditPaidOffWarning = (name: unknown) => marked.push(String(name || ""));

const transferTypes = {
  TRANSFER_EVERYTHING_EXCEPT: "Transfer Everything Except",
  TRANSFER_AMOUNT: "Transfer Amount",
  REPAYMENT_AMOUNT: "Repayment Amount",
  REPAYMENT_ALL: "Repayment All",
};

const resolverCtx = {
  transferTypes,
  accountKey: (value: unknown) => String(value || "").trim().toLowerCase(),
  roundMoney: (value: unknown) => Math.round(Number(value || 0) * 100) / 100,
};

const event1: Record<string, unknown> = {
  name: "Pay card",
  transferBehavior: transferTypes.REPAYMENT_ALL,
  to: "Card",
};
const result1 = resolveTransferAmountForJournalWithDefault(
  { card: 0 },
  event1,
  100,
  resolverCtx,
  markCreditPaidOffWarning
);
assert.deepEqual(result1, { amount: 0, skip: true });
assert.equal(event1.appliedAmount, 0);
assert.equal(event1.skipJournal, true);
assert.deepEqual(marked, ["Pay card"]);

const event2: Record<string, unknown> = {
  name: "Move cash",
  transferBehavior: transferTypes.TRANSFER_AMOUNT,
  from: "Cash",
  to: "Offset",
};
const result2 = resolveTransferAmountForJournalWithDefault(
  { cash: 200, offset: 0 },
  event2,
  50,
  resolverCtx,
  markCreditPaidOffWarning
);
assert.deepEqual(result2, { amount: 50, skip: false });
assert.equal(event2.skipJournal, undefined);
